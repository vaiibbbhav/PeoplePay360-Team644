import { db } from '../../shared/db';
import { attendance, employees, users, workingScheduleLines } from '../../db/schema';
import { eq, and, gte, lte, desc, inArray, count, sql } from 'drizzle-orm';

export async function findAllAttendance(employeeId?: string, startDate?: string, endDate?: string) {
  const conditions = [];

  if (employeeId) conditions.push(eq(attendance.employeeId, employeeId));
  if (startDate) conditions.push(gte(attendance.date, startDate));
  if (endDate) conditions.push(lte(attendance.date, endDate));

  const query = db
    .select({
      id: attendance.id,
      employee_id: attendance.employeeId,
      employee_name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      employee_email: users.email,
      date: attendance.date,
      check_in: attendance.checkIn,
      check_out: attendance.checkOut,
      worked_hours: attendance.workedHours,
      status: attendance.status,
      exception_note: attendance.exceptionNote,
      is_manual_edit: attendance.isManualEdit,
      created_at: attendance.createdAt,
      updated_at: attendance.updatedAt,
    })
    .from(attendance)
    .leftJoin(employees, eq(attendance.employeeId, employees.id))
    .leftJoin(users, eq(employees.userId, users.id))
    .orderBy(desc(attendance.date));

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  return await query;
}

export async function findAttendanceById(id: string) {
  const rows = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);

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

export async function findOpenAttendance(employeeId: string) {
  const rows = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, employeeId),
        sql`${attendance.checkIn} IS NOT NULL`,
        sql`${attendance.checkOut} IS NULL`,
      ),
    )
    .orderBy(desc(attendance.date))
    .limit(1);
  return rows[0] || null;
}

export async function findScheduleLineForDate(employeeId: string, dayOfWeek: string) {
  const rows = await db
    .select({
      startTime: workingScheduleLines.startTime,
      endTime: workingScheduleLines.endTime,
      breakMinutes: workingScheduleLines.breakMinutes,
    })
    .from(employees)
    .innerJoin(
      workingScheduleLines,
      eq(employees.workingScheduleId, workingScheduleLines.scheduleId),
    )
    .where(and(eq(employees.id, employeeId), eq(workingScheduleLines.dayOfWeek, dayOfWeek)))
    .limit(1);
  return rows[0] || null;
}

export type UpsertAttendanceData = {
  id?: string | null;
  employeeId: string;
  date: string;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  workedHours?: number | string;
  status?: string;
  exceptionNote?: string | null;
  isManualEdit?: boolean;
};

export async function upsertAttendance(data: UpsertAttendanceData) {
  let existing = null;
  if (data.id) {
    existing = await findAttendanceById(data.id);
  }
  if (!existing) {
    existing = await findAttendanceByEmployeeAndDate(data.employeeId, data.date);
  }

  if (existing) {
    const [updated] = await db
      .update(attendance)
      .set({
        date: data.date || existing.date,
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

export async function deleteAttendance(id: string) {
  const [deleted] = await db.delete(attendance).where(eq(attendance.id, id)).returning();
  return deleted || null;
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
