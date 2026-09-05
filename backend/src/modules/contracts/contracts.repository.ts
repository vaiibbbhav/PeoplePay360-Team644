import { db } from '../../shared/db';
import { contracts, employees, salaryStructures } from '../../db/schema';
import { eq, and, lte, gte, or, isNull, desc, ne } from 'drizzle-orm';

export async function findAllContracts(employeeId?: string) {
  const query = db
    .select({
      id: contracts.id,
      employee_id: contracts.employeeId,
      name: contracts.name,
      wage: contracts.wage,
      wage_type: contracts.wageType,
      salary_structure_id: contracts.salaryStructureId,
      salary_structure_name: salaryStructures.name,
      working_schedule_id: contracts.workingScheduleId,
      department_id: contracts.departmentId,
      job_position_id: contracts.jobPositionId,
      start_date: contracts.startDate,
      end_date: contracts.endDate,
      status: contracts.status,
      notes: contracts.notes,
      created_at: contracts.createdAt,
    })
    .from(contracts)
    .leftJoin(employees, eq(contracts.employeeId, employees.id))
    .leftJoin(salaryStructures, eq(contracts.salaryStructureId, salaryStructures.id));

  if (employeeId) {
    return await query
      .where(eq(contracts.employeeId, employeeId))
      .orderBy(desc(contracts.startDate));
  }
  return await query.orderBy(desc(contracts.startDate));
}

export async function findContractById(id: string) {
  const rows = await db
    .select({
      id: contracts.id,
      employee_id: contracts.employeeId,
      name: contracts.name,
      wage: contracts.wage,
      wage_type: contracts.wageType,
      salary_structure_id: contracts.salaryStructureId,
      salary_structure_name: salaryStructures.name,
      working_schedule_id: contracts.workingScheduleId,
      department_id: contracts.departmentId,
      job_position_id: contracts.jobPositionId,
      start_date: contracts.startDate,
      end_date: contracts.endDate,
      status: contracts.status,
      notes: contracts.notes,
      created_at: contracts.createdAt,
    })
    .from(contracts)
    .leftJoin(salaryStructures, eq(contracts.salaryStructureId, salaryStructures.id))
    .where(eq(contracts.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function findActiveContractForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
) {
  const rows = await db
    .select({
      id: contracts.id,
      employee_id: contracts.employeeId,
      name: contracts.name,
      wage: contracts.wage,
      wage_type: contracts.wageType,
      salary_structure_id: contracts.salaryStructureId,
      salary_structure_name: salaryStructures.name,
      working_schedule_id: contracts.workingScheduleId,
      department_id: contracts.departmentId,
      job_position_id: contracts.jobPositionId,
      start_date: contracts.startDate,
      end_date: contracts.endDate,
      status: contracts.status,
      notes: contracts.notes,
      created_at: contracts.createdAt,
    })
    .from(contracts)
    .leftJoin(salaryStructures, eq(contracts.salaryStructureId, salaryStructures.id))
    .where(
      and(
        eq(contracts.employeeId, employeeId),
        eq(contracts.status, 'active'),
        lte(contracts.startDate, periodEnd),
        or(isNull(contracts.endDate), gte(contracts.endDate, periodStart)),
      ),
    )
    .orderBy(desc(contracts.startDate))
    .limit(1);

  return rows[0] || null;
}

export async function findOverlappingActiveContracts(
  employeeId: string,
  startDate: string,
  endDate: string | null,
  excludeId?: string,
) {
  const conditions = [
    eq(contracts.employeeId, employeeId),
    eq(contracts.status, 'active'),
    lte(contracts.startDate, endDate || '9999-12-31'),
    or(isNull(contracts.endDate), gte(contracts.endDate, startDate)),
  ];

  if (excludeId) {
    conditions.push(ne(contracts.id, excludeId));
  }

  return await db
    .select()
    .from(contracts)
    .where(and(...conditions));
}

export async function insertContract(data: Record<string, any>) {
  const [created] = await db
    .insert(contracts)
    .values({
      employeeId: data.employeeId,
      name: data.name,
      wage: String(data.wage),
      wageType: data.wageType || 'monthly',
      salaryStructureId: data.salaryStructureId,
      workingScheduleId: data.workingScheduleId,
      departmentId: data.departmentId,
      jobPositionId: data.jobPositionId,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || 'draft',
      notes: data.notes,
    })
    .returning();
  return created;
}

export async function updateContract(id: string, data: Record<string, any>) {
  const values: Record<string, any> = {};
  if (data.name !== undefined) values.name = data.name;
  if (data.wage !== undefined) values.wage = String(data.wage);
  if (data.wageType !== undefined) values.wageType = data.wageType;
  if (data.salaryStructureId !== undefined) values.salaryStructureId = data.salaryStructureId;
  if (data.workingScheduleId !== undefined) values.workingScheduleId = data.workingScheduleId;
  if (data.departmentId !== undefined) values.departmentId = data.departmentId;
  if (data.jobPositionId !== undefined) values.jobPositionId = data.jobPositionId;
  if (data.startDate !== undefined) values.startDate = data.startDate;
  if (data.endDate !== undefined) values.endDate = data.endDate;
  if (data.status !== undefined) values.status = data.status;
  if (data.notes !== undefined) values.notes = data.notes;

  values.updatedAt = new Date();
  const [updated] = await db.update(contracts).set(values).where(eq(contracts.id, id)).returning();
  return updated || null;
}
