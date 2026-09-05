import { db } from '../../shared/db';
import { workingSchedules, workingScheduleLines, employees, contracts } from '../../db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import type { ScheduleLineInput } from './schedules.validators';

export type WorkingScheduleRecord = typeof workingSchedules.$inferSelect;
export type WorkingScheduleLineRecord = typeof workingScheduleLines.$inferSelect;

export async function findAllSchedules() {
  // Query all schedules with count of assigned employees
  const schedules = await db
    .select({
      id: workingSchedules.id,
      name: workingSchedules.name,
      weeklyHours: workingSchedules.weeklyHours,
      isActive: workingSchedules.isActive,
      createdAt: workingSchedules.createdAt,
      employeeCount: sql<number>`(
        SELECT count(*)::int FROM ${employees} WHERE ${employees.workingScheduleId} = ${workingSchedules.id}
      )`,
      activeContractCount: sql<number>`(
        SELECT count(*)::int FROM ${contracts} WHERE ${contracts.workingScheduleId} = ${workingSchedules.id} AND ${contracts.status} = 'active'
      )`,
    })
    .from(workingSchedules)
    .orderBy(workingSchedules.name);

  const scheduleIds = schedules.map((s) => s.id);
  const linesByScheduleId = new Map<string, WorkingScheduleLineRecord[]>();

  if (scheduleIds.length > 0) {
    const lines = await db
      .select()
      .from(workingScheduleLines)
      .where(inArray(workingScheduleLines.scheduleId, scheduleIds));

    for (const line of lines) {
      const list = linesByScheduleId.get(line.scheduleId) || [];
      list.push(line);
      linesByScheduleId.set(line.scheduleId, list);
    }
  }

  return schedules.map((s) => ({
    ...s,
    weeklyHours: Number(s.weeklyHours) || 0,
    lines: linesByScheduleId.get(s.id) || [],
  }));
}

export async function findScheduleById(id: string) {
  const [schedule] = await db
    .select({
      id: workingSchedules.id,
      name: workingSchedules.name,
      weeklyHours: workingSchedules.weeklyHours,
      isActive: workingSchedules.isActive,
      createdAt: workingSchedules.createdAt,
      employeeCount: sql<number>`(
        SELECT count(*)::int FROM ${employees} WHERE ${employees.workingScheduleId} = ${workingSchedules.id}
      )`,
    })
    .from(workingSchedules)
    .where(eq(workingSchedules.id, id))
    .limit(1);

  if (!schedule) return null;

  const lines = await db
    .select()
    .from(workingScheduleLines)
    .where(eq(workingScheduleLines.scheduleId, id));

  const dayOrder: Record<string, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };

  const sortedLines = [...lines].sort((a, b) => {
    return (dayOrder[a.dayOfWeek] || 99) - (dayOrder[b.dayOfWeek] || 99);
  });

  return {
    ...schedule,
    weeklyHours: Number(schedule.weeklyHours) || 0,
    lines: sortedLines,
  };
}

export async function createScheduleWithLines(
  scheduleData: { name: string; weeklyHours: string; isActive?: boolean },
  lines: ScheduleLineInput[],
) {
  return await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(workingSchedules)
      .values({
        name: scheduleData.name,
        weeklyHours: scheduleData.weeklyHours,
        isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
      })
      .returning();

    if (lines.length > 0) {
      await tx.insert(workingScheduleLines).values(
        lines.map((l) => ({
          scheduleId: inserted.id,
          dayOfWeek: l.dayOfWeek,
          startTime: l.startTime,
          endTime: l.endTime,
          breakMinutes: l.breakMinutes,
        })),
      );
    }

    return inserted;
  });
}

export async function updateScheduleWithLines(
  id: string,
  scheduleData: { name?: string; weeklyHours?: string; isActive?: boolean },
  lines?: ScheduleLineInput[],
) {
  return await db.transaction(async (tx) => {
    const updatePayload: Record<string, any> = {};
    if (scheduleData.name !== undefined) updatePayload.name = scheduleData.name;
    if (scheduleData.weeklyHours !== undefined) updatePayload.weeklyHours = scheduleData.weeklyHours;
    if (scheduleData.isActive !== undefined) updatePayload.isActive = scheduleData.isActive;

    if (Object.keys(updatePayload).length > 0) {
      await tx
        .update(workingSchedules)
        .set(updatePayload)
        .where(eq(workingSchedules.id, id));
    }

    if (lines !== undefined) {
      await tx
        .delete(workingScheduleLines)
        .where(eq(workingScheduleLines.scheduleId, id));

      if (lines.length > 0) {
        await tx.insert(workingScheduleLines).values(
          lines.map((l) => ({
            scheduleId: id,
            dayOfWeek: l.dayOfWeek,
            startTime: l.startTime,
            endTime: l.endTime,
            breakMinutes: l.breakMinutes,
          })),
        );
      }
    }

    return findScheduleById(id);
  });
}

export async function countScheduleReferences(id: string) {
  const [empRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(eq(employees.workingScheduleId, id));

  const [contractRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contracts)
    .where(eq(contracts.workingScheduleId, id));

  return {
    employees: empRes?.count || 0,
    contracts: contractRes?.count || 0,
  };
}

export async function deleteSchedule(id: string) {
  return await db.delete(workingSchedules).where(eq(workingSchedules.id, id));
}
