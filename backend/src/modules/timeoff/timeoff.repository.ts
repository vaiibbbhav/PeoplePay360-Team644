import { db } from '../../shared/db';
import {
  timeOffTypes,
  timeOffAllocations,
  timeOffRequests,
  employees,
  users,
  departments,
  jobPositions,
} from '../../db/schema';
import { eq, and, lte, gte, gt, desc, sql, type SQL } from 'drizzle-orm';
import { ConflictError, NotFoundError } from '../../shared/errors';

export type RequestFilterOptions = {
  employeeId?: string;
  managerId?: string;
  status?: string;
  timeOffTypeId?: string;
};

export async function findAllTimeOffTypes() {
  return await db.select().from(timeOffTypes).orderBy(timeOffTypes.name);
}

export async function findTimeOffTypeById(id: string) {
  const rows = await db.select().from(timeOffTypes).where(eq(timeOffTypes.id, id)).limit(1);
  return rows[0] || null;
}

export async function insertTimeOffType(data: Record<string, any>) {
  const [created] = await db
    .insert(timeOffTypes)
    .values({
      name: data.name,
      code: data.code,
      unit: data.unit || 'days',
      requiresAllocation: data.requiresAllocation ?? true,
      approvalType: data.approvalType || 'hr_only',
      isPaid: data.isPaid ?? true,
      isActive: data.isActive ?? true,
    })
    .returning();
  return created;
}

export async function findAllAllocations(employeeId?: string) {
  const query = db
    .select({
      id: timeOffAllocations.id,
      employee_id: timeOffAllocations.employeeId,
      employee_name: sql<string>`coalesce(${users.firstName} || ' ' || ${users.lastName}, 'Unknown')`,
      employee_email: users.email,
      department_name: departments.name,
      time_off_type_id: timeOffAllocations.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_unit: timeOffTypes.unit,
      is_paid: timeOffTypes.isPaid,
      allocated_amount: timeOffAllocations.allocatedAmount,
      taken_amount: timeOffAllocations.takenAmount,
      remaining_amount: timeOffAllocations.remainingAmount,
      valid_from: timeOffAllocations.validFrom,
      valid_to: timeOffAllocations.validTo,
      status: timeOffAllocations.status,
      approved_by: timeOffAllocations.approvedBy,
      approved_at: timeOffAllocations.approvedAt,
      created_at: timeOffAllocations.createdAt,
    })
    .from(timeOffAllocations)
    .leftJoin(timeOffTypes, eq(timeOffAllocations.timeOffTypeId, timeOffTypes.id))
    .leftJoin(employees, eq(timeOffAllocations.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id));

  if (employeeId) {
    return await query
      .where(eq(timeOffAllocations.employeeId, employeeId))
      .orderBy(desc(timeOffAllocations.createdAt));
  }
  return await query.orderBy(desc(timeOffAllocations.createdAt));
}

export async function findAllocationById(id: string) {
  const rows = await db
    .select({
      id: timeOffAllocations.id,
      employee_id: timeOffAllocations.employeeId,
      employee_name: sql<string>`coalesce(${users.firstName} || ' ' || ${users.lastName}, 'Unknown')`,
      employee_email: users.email,
      department_name: departments.name,
      time_off_type_id: timeOffAllocations.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_unit: timeOffTypes.unit,
      is_paid: timeOffTypes.isPaid,
      allocated_amount: timeOffAllocations.allocatedAmount,
      taken_amount: timeOffAllocations.takenAmount,
      remaining_amount: timeOffAllocations.remainingAmount,
      valid_from: timeOffAllocations.validFrom,
      valid_to: timeOffAllocations.validTo,
      status: timeOffAllocations.status,
      approved_by: timeOffAllocations.approvedBy,
      approved_at: timeOffAllocations.approvedAt,
      created_at: timeOffAllocations.createdAt,
    })
    .from(timeOffAllocations)
    .leftJoin(timeOffTypes, eq(timeOffAllocations.timeOffTypeId, timeOffTypes.id))
    .leftJoin(employees, eq(timeOffAllocations.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(timeOffAllocations.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function findValidAllocation(employeeId: string, typeId: string, dateStr: string) {
  const rows = await db
    .select()
    .from(timeOffAllocations)
    .where(
      and(
        eq(timeOffAllocations.employeeId, employeeId),
        eq(timeOffAllocations.timeOffTypeId, typeId),
        eq(timeOffAllocations.status, 'approved'),
        lte(timeOffAllocations.validFrom, dateStr),
        gte(timeOffAllocations.validTo, dateStr),
        gt(timeOffAllocations.remainingAmount, '0'),
      ),
    )
    .orderBy(timeOffAllocations.validTo)
    .limit(1);

  return rows[0] || null;
}

export async function insertAllocation(data: Record<string, any>) {
  const [created] = await db
    .insert(timeOffAllocations)
    .values({
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      allocatedAmount: String(data.allocatedAmount),
      takenAmount: '0.0',
      remainingAmount: String(data.allocatedAmount),
      validFrom: data.validFrom,
      validTo: data.validTo,
      status: data.status || 'draft',
      approvedBy: data.approvedBy || null,
      approvedAt: data.status === 'approved' ? new Date() : null,
    })
    .returning();
  return created;
}

export async function approveAllocation(id: string, approverId?: string) {
  const [approved] = await db
    .update(timeOffAllocations)
    .set({
      status: 'approved',
      approvedBy: approverId || null,
      approvedAt: new Date(),
    })
    .where(eq(timeOffAllocations.id, id))
    .returning();
  return approved || null;
}

export async function countDirectReports(employeeId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(eq(employees.managerId, employeeId));
  return rows[0]?.count || 0;
}

export async function isDirectManager(
  managerEmployeeId: string,
  targetEmployeeId: string,
): Promise<boolean> {
  const [emp] = await db
    .select({ managerId: employees.managerId })
    .from(employees)
    .where(eq(employees.id, targetEmployeeId))
    .limit(1);
  return emp?.managerId === managerEmployeeId;
}

export async function findAllRequests(filters?: RequestFilterOptions | string) {
  const query = db
    .select({
      id: timeOffRequests.id,
      employee_id: timeOffRequests.employeeId,
      employee_name: sql<string>`coalesce(${users.firstName} || ' ' || ${users.lastName}, 'Unknown')`,
      employee_email: users.email,
      employee_avatar: employees.avatarUrl,
      department_id: employees.departmentId,
      department_name: departments.name,
      job_position_title: jobPositions.title,
      manager_id: employees.managerId,
      time_off_type_id: timeOffRequests.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_code: timeOffTypes.code,
      type_unit: timeOffTypes.unit,
      is_paid: timeOffTypes.isPaid,
      requires_allocation: timeOffTypes.requiresAllocation,
      start_date: timeOffRequests.startDate,
      end_date: timeOffRequests.endDate,
      duration: timeOffRequests.duration,
      reason: timeOffRequests.reason,
      status: timeOffRequests.status,
      approved_by: timeOffRequests.approvedBy,
      approved_at: timeOffRequests.approvedAt,
      refused_reason: timeOffRequests.refusedReason,
      created_at: timeOffRequests.createdAt,
      updated_at: timeOffRequests.updatedAt,
    })
    .from(timeOffRequests)
    .leftJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
    .leftJoin(employees, eq(timeOffRequests.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id));

  // Handle legacy string argument or filter object
  const opts: RequestFilterOptions =
    typeof filters === 'string' ? { employeeId: filters } : filters || {};

  const conditions: SQL[] = [];

  if (opts.employeeId) {
    conditions.push(eq(timeOffRequests.employeeId, opts.employeeId));
  }
  if (opts.managerId) {
    conditions.push(eq(employees.managerId, opts.managerId));
  }
  if (opts.status) {
    conditions.push(eq(timeOffRequests.status, opts.status));
  }
  if (opts.timeOffTypeId) {
    conditions.push(eq(timeOffRequests.timeOffTypeId, opts.timeOffTypeId));
  }

  if (conditions.length > 0) {
    return await query
      .where(and(...conditions))
      .orderBy(desc(timeOffRequests.startDate), desc(timeOffRequests.createdAt));
  }

  return await query.orderBy(desc(timeOffRequests.startDate), desc(timeOffRequests.createdAt));
}

export async function findRequestById(id: string) {
  const rows = await db
    .select({
      id: timeOffRequests.id,
      employee_id: timeOffRequests.employeeId,
      employee_name: sql<string>`coalesce(${users.firstName} || ' ' || ${users.lastName}, 'Unknown')`,
      employee_email: users.email,
      employee_avatar: employees.avatarUrl,
      department_id: employees.departmentId,
      department_name: departments.name,
      job_position_title: jobPositions.title,
      manager_id: employees.managerId,
      time_off_type_id: timeOffRequests.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_code: timeOffTypes.code,
      type_unit: timeOffTypes.unit,
      is_paid: timeOffTypes.isPaid,
      requires_allocation: timeOffTypes.requiresAllocation,
      start_date: timeOffRequests.startDate,
      end_date: timeOffRequests.endDate,
      duration: timeOffRequests.duration,
      reason: timeOffRequests.reason,
      status: timeOffRequests.status,
      approved_by: timeOffRequests.approvedBy,
      approved_at: timeOffRequests.approvedAt,
      refused_reason: timeOffRequests.refusedReason,
      created_at: timeOffRequests.createdAt,
      updated_at: timeOffRequests.updatedAt,
    })
    .from(timeOffRequests)
    .leftJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
    .leftJoin(employees, eq(timeOffRequests.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(jobPositions, eq(employees.jobPositionId, jobPositions.id))
    .where(eq(timeOffRequests.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function insertRequest(data: Record<string, any>) {
  const [created] = await db
    .insert(timeOffRequests)
    .values({
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: String(data.duration),
      reason: data.reason || null,
      status: 'pending',
    })
    .returning();
  return created;
}

export async function executeApproveRequestTx(
  requestId: string,
  allocationId: string | null,
  duration: number,
  approverId?: string,
) {
  return await db.transaction(async (tx) => {
    if (allocationId) {
      const [alloc] = await tx
        .select()
        .from(timeOffAllocations)
        .where(eq(timeOffAllocations.id, allocationId))
        .for('update')
        .limit(1);

      if (!alloc) {
        throw new NotFoundError('Leave allocation record not found');
      }

      const currentRemaining = parseFloat(alloc.remainingAmount);
      if (currentRemaining < duration) {
        throw new ConflictError(
          `Insufficient leave allocation balance (remaining: ${currentRemaining}, requested: ${duration})`,
        );
      }

      const taken = parseFloat(alloc.takenAmount) + duration;
      const remaining = currentRemaining - duration;

      await tx
        .update(timeOffAllocations)
        .set({
          takenAmount: String(taken),
          remainingAmount: String(remaining),
        })
        .where(
          and(
            eq(timeOffAllocations.id, allocationId),
            gte(timeOffAllocations.remainingAmount, String(duration)),
          ),
        );
    }

    const [updated] = await tx
      .update(timeOffRequests)
      .set({
        status: 'approved',
        approvedBy: approverId || null,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(timeOffRequests.id, requestId), eq(timeOffRequests.status, 'pending')))
      .returning();

    if (!updated) {
      throw new ConflictError('Leave request is no longer pending or has already been processed');
    }

    return updated;
  });
}

export async function refuseRequest(id: string, reason?: string) {
  const [refused] = await db
    .update(timeOffRequests)
    .set({
      status: 'refused',
      refusedReason: reason || null,
      updatedAt: new Date(),
    })
    .where(eq(timeOffRequests.id, id))
    .returning();
  return refused || null;
}
