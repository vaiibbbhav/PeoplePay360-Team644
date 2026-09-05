import * as hrRepo from './hr.repository';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { db } from '../../shared/db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

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

export async function createEmployee(data: Record<string, any>) {
  const email = (data.email as string).toLowerCase().trim();
  const existing = await hrRepo.findEmployeeByEmail(email);
  if (existing) {
    throw new ConflictError(`Employee with email ${email} already exists`);
  }

  let userId = data.userId as string | undefined;
  if (!userId) {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser[0]) {
      userId = existingUser[0].id;
    } else {
      const salt = await bcrypt.genSalt(10);
      const defaultPasswordHash = await bcrypt.hash('Employee@123', salt);
      const [newUser] = await db
        .insert(users)
        .values({
          firstName: data.firstName || 'New',
          lastName: data.lastName || 'Employee',
          email,
          passwordHash: defaultPasswordHash,
          role: 'Employee',
          isActive: true,
        })
        .returning();
      userId = newUser.id;
    }
  }

  return await hrRepo.insertEmployee({
    ...data,
    userId,
  });
}

export async function updateEmployee(id: string, data: Record<string, unknown>) {
  await getEmployeeById(id);
  return await hrRepo.updateEmployeeById(id, data);
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
