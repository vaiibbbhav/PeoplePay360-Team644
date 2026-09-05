import { db } from '../../shared/db';
import { attendance, employees } from '../../db/schema';
import { eq, and, gte, lte, desc, inArray, count } from 'drizzle-orm';

export async function findAllAttendance(employeeId?: string, startDate?: string, endDate?: string) {
  const conditions = [];

  if (employeeId) conditions.push(eq(attendance.employeeId, employeeId));
  if (startDate) conditions.push(gte(attendance.date, startDate));
  if (endDate) conditions.push(lte(attendance.date, endDate));

  const query = db
    .select({
      id: attendance.id,
      employee_id: attendance.employeeId,
      employee_name: employees.firstName,
      date: attendance.date,
      check_in: attendance.checkIn,
      check_out: attendance.checkOut,
      worked_hours: attendance.workedHours,
      status: attendance.status,
      exception_note: attendance.exceptionNote,
      is_manual_edit: attendance.isManualEdit,
      created_at: attendance.createdAt,
    })
    .from(attendance)
    .leftJoin(employees, eq(attendance.employeeId, employees.id))
    .orderBy(desc(attendance.date));

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  return await query;
}

export async function findAttendanceById(id: string) {
  const rows = await db
    .select({
      id: attendance.id,
      employee_id: attendance.employeeId,
      date: attendance.date,
      check_in: attendance.checkIn,
      check_out: attendance.checkOut,
      worked_hours: attendance.workedHours,
      status: attendance.status,
      exception_note: attendance.exceptionNote,
      is_manual_edit: attendance.isManualEdit,
      created_at: attendance.createdAt,
    })
    .from(attendance)
    .where(eq(attendance.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function findAttendanceByEmployeeAndDate(employeeId: string, dateStr: string) {
  const rows = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.employeeId, employeeId), eq(attendance.date, dateStr)))
    .limit(1);

  return rows[0] || null;
}

export async function upsertAttendance(data: Record<string, any>) {
  const existing = await findAttendanceByEmployeeAndDate(data.employeeId, data.date);

  if (existing) {
    const [updated] = await db
      .update(attendance)
      .set({
        checkIn: data.checkIn ? new Date(data.checkIn) : existing.checkIn,
        checkOut: data.checkOut ? new Date(data.checkOut) : existing.checkOut,
        workedHours:
          data.workedHours !== undefined ? String(data.workedHours) : existing.workedHours,
        status: data.status || existing.status,
        exceptionNote:
          data.exceptionNote !== undefined ? data.exceptionNote : existing.exceptionNote,
        isManualEdit: data.isManualEdit ?? existing.isManualEdit,
        updatedAt: new Date(),
      })
      .where(eq(attendance.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(attendance)
    .values({
      employeeId: data.employeeId,
      date: data.date,
      checkIn: data.checkIn ? new Date(data.checkIn) : null,
      checkOut: data.checkOut ? new Date(data.checkOut) : null,
      workedHours: String(data.workedHours || 0),
      status: data.status || 'Present',
      exceptionNote: data.exceptionNote || null,
      isManualEdit: data.isManualEdit ?? false,
    })
    .returning();
  return created;
}

export async function countWorkedDaysForPeriod(
  employeeId: string,
  startDate: string,
  endDate: string,
) {
  const [res] = await db
    .select({ val: count() })
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, employeeId),
        gte(attendance.date, startDate),
        lte(attendance.date, endDate),
        inArray(attendance.status, ['Present', 'Late', 'Overtime', 'Half-day']),
      ),
    );

  return res?.val ?? 0;
}
