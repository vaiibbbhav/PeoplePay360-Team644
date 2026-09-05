import { db } from '../../shared/db';
import { timeOffTypes, timeOffAllocations, timeOffRequests } from '../../db/schema';
import { eq, and, lte, gte, gt, desc } from 'drizzle-orm';

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
      time_off_type_id: timeOffAllocations.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_unit: timeOffTypes.unit,
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
    .leftJoin(timeOffTypes, eq(timeOffAllocations.timeOffTypeId, timeOffTypes.id));

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
      time_off_type_id: timeOffAllocations.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_unit: timeOffTypes.unit,
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
      status: 'draft',
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

export async function findAllRequests(employeeId?: string) {
  const query = db
    .select({
      id: timeOffRequests.id,
      employee_id: timeOffRequests.employeeId,
      time_off_type_id: timeOffRequests.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_unit: timeOffTypes.unit,
      start_date: timeOffRequests.startDate,
      end_date: timeOffRequests.endDate,
      duration: timeOffRequests.duration,
      reason: timeOffRequests.reason,
      status: timeOffRequests.status,
      approved_by: timeOffRequests.approvedBy,
      approved_at: timeOffRequests.approvedAt,
      refused_reason: timeOffRequests.refusedReason,
      created_at: timeOffRequests.createdAt,
    })
    .from(timeOffRequests)
    .leftJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id));

  if (employeeId) {
    return await query
      .where(eq(timeOffRequests.employeeId, employeeId))
      .orderBy(desc(timeOffRequests.startDate));
  }
  return await query.orderBy(desc(timeOffRequests.startDate));
}

export async function findRequestById(id: string) {
  const rows = await db
    .select({
      id: timeOffRequests.id,
      employee_id: timeOffRequests.employeeId,
      time_off_type_id: timeOffRequests.timeOffTypeId,
      type_name: timeOffTypes.name,
      type_unit: timeOffTypes.unit,
      start_date: timeOffRequests.startDate,
      end_date: timeOffRequests.endDate,
      duration: timeOffRequests.duration,
      reason: timeOffRequests.reason,
      status: timeOffRequests.status,
      approved_by: timeOffRequests.approvedBy,
      approved_at: timeOffRequests.approvedAt,
      refused_reason: timeOffRequests.refusedReason,
      created_at: timeOffRequests.createdAt,
    })
    .from(timeOffRequests)
    .leftJoin(timeOffTypes, eq(timeOffRequests.timeOffTypeId, timeOffTypes.id))
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
        .limit(1);

      if (alloc) {
        const taken = parseFloat(alloc.takenAmount) + duration;
        const remaining = parseFloat(alloc.remainingAmount) - duration;
        await tx
          .update(timeOffAllocations)
          .set({
            takenAmount: String(taken),
            remainingAmount: String(remaining),
          })
          .where(eq(timeOffAllocations.id, allocationId));
      }
    }

    const [updated] = await tx
      .update(timeOffRequests)
      .set({
        status: 'approved',
        approvedBy: approverId || null,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(timeOffRequests.id, requestId))
      .returning();

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
