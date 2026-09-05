import * as hrRepo from './hr.repository';
import { NotFoundError, ConflictError } from '../../shared/errors';

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

export async function createEmployee(data: Record<string, unknown>) {
  const existing = await hrRepo.findEmployeeByEmail(data.email as string);
  if (existing) {
    throw new ConflictError(`Employee with email ${data.email} already exists`);
  }
  return await hrRepo.insertEmployee(data);
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
