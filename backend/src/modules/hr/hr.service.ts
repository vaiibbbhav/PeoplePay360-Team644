import * as hrRepo from './hr.repository';
import * as usersRepo from '../users/users.repository';
import { NotFoundError, ConflictError } from '../../shared/errors';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { CreateEmployeeInput, UpdateEmployeeInput } from './hr.validators';

export async function listEmployees() {
  return await hrRepo.findAllEmployees();
}

export async function getEmployeeById(id: string) {
  const employee = await hrRepo.findEmployeeById(id);
  if (!employee) {
    throw new NotFoundError(`Employee with ID ${id} not found`);
  }
  return employee;
}

export async function getEmployeeHubDetails(id: string) {
  const employee = await getEmployeeById(id);
  const stats = await hrRepo.getEmployeeStats(id);
  return {
    ...employee,
    smartCounts: {
      contracts: stats.contract_count,
      attendance: stats.attendance_count,
      timeOff: stats.time_off_count,
      payslips: stats.payslip_count,
    },
  };
}

export async function createEmployee(data: CreateEmployeeInput & { userId?: string }) {
  const email = data.email.toLowerCase().trim();
  const existing = await hrRepo.findEmployeeByEmail(email);
  if (existing) {
    throw new ConflictError(`Employee with email ${email} already exists`);
  }

  let userId = data.userId;
  if (!userId) {
    const existingUser = await usersRepo.findUserByEmail(email);
    if (existingUser) {
      userId = existingUser.id;
      if (data.firstName !== undefined || data.lastName !== undefined) {
        await usersRepo.updateUser(userId, {
          ...(data.firstName ? { firstName: data.firstName } : {}),
          ...(data.lastName ? { lastName: data.lastName } : {}),
        });
      }
    } else {
      const generatedPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      const salt = await bcrypt.genSalt(10);
      const defaultPasswordHash = await bcrypt.hash(generatedPassword, salt);
      const newUser = await usersRepo.createUser({
        firstName: data.firstName || 'New',
        lastName: data.lastName || 'Employee',
        email,
        passwordHash: defaultPasswordHash,
        role: 'Employee',
        isActive: true,
      });
      userId = newUser.id;
    }
  }

  const created = await hrRepo.insertEmployee({
    ...data,
    userId,
  });
  return await getEmployeeById(created.id);
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  await getEmployeeById(id);
  await hrRepo.updateEmployeeById(id, data);
  return await getEmployeeById(id);
}

export async function deleteEmployee(id: string) {
  await getEmployeeById(id);
  return await hrRepo.deleteEmployeeById(id);
}

export async function getEmployeesForKanban() {
  const employees = await hrRepo.findAllEmployees();
  const grouped: Record<string, typeof employees> = {
    active: [],
    on_leave: [],
    inactive: [],
    terminated: [],
  };

  for (const emp of employees) {
    const status = emp.employment_status || 'active';
    if (!grouped[status]) {
      grouped[status] = [];
    }
    grouped[status].push(emp);
  }

  return grouped;
}

export async function getMetadataOptions() {
  const [departmentsList, jobPositionsList, schedulesList, employeesList] = await Promise.all([
    hrRepo.findAllDepartments(),
    hrRepo.findAllJobPositions(),
    hrRepo.findAllWorkingSchedules(),
    hrRepo.findAllEmployees(),
  ]);

  return {
    departments: departmentsList.map((d) => ({ id: d.id, name: d.name })),
    jobPositions: jobPositionsList.map((j) => ({
      id: j.id,
      title: j.title,
      departmentId: j.departmentId,
    })),
    workingSchedules: schedulesList.map((s) => ({
      id: s.id,
      name: s.name,
      weeklyHours: s.weeklyHours,
    })),
    managers: employeesList.map((e) => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name}`,
      email: e.email,
    })),
  };
}
export async function getEmployeePayslips(employeeId: string) {
  await getEmployeeById(employeeId);
  return await hrRepo.findPayslipsByEmployeeId(employeeId);
}
