import * as schedulesRepo from './schedules.repository';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { roundToTwoDecimals } from '../../shared/formatters';
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleLineInput,
} from './schedules.validators';

/**
 * Calculates total weekly hours from daily schedule lines.
 * Each line: (endTime - startTime) - breakMinutes
 */
export function calculateWeeklyHours(lines: ScheduleLineInput[]): number {
  let totalMinutes = 0;

  for (const line of lines) {
    const [startH, startM] = line.startTime.split(':').map(Number);
    const [endH, endM] = line.endTime.split(':').map(Number);

    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);

    const durationMinutes = Math.max(0, endTotal - startTotal);
    const workedMinutes = Math.max(0, durationMinutes - (line.breakMinutes || 0));

    totalMinutes += workedMinutes;
  }

  const hours = totalMinutes / 60;
  return roundToTwoDecimals(hours);
}

export async function listSchedules() {
  return await schedulesRepo.findAllSchedules();
}

export async function getScheduleById(id: string) {
  const schedule = await schedulesRepo.findScheduleById(id);
  if (!schedule) {
    throw new NotFoundError(`Working schedule with ID '${id}' not found`);
  }
  return schedule;
}

export async function createSchedule(input: CreateScheduleInput) {
  const computedHours = calculateWeeklyHours(input.lines);

  const created = await schedulesRepo.createScheduleWithLines(
    {
      name: input.name,
      weeklyHours: computedHours.toFixed(2),
      isActive: input.isActive,
    },
    input.lines,
  );

  return await getScheduleById(created.id);
}

export async function updateSchedule(id: string, input: UpdateScheduleInput) {
  await getScheduleById(id);

  let weeklyHours: string | undefined = undefined;
  if (input.lines) {
    const computedHours = calculateWeeklyHours(input.lines);
    weeklyHours = computedHours.toFixed(2);
  }

  await schedulesRepo.updateScheduleWithLines(
    id,
    {
      name: input.name,
      weeklyHours,
      isActive: input.isActive,
    },
    input.lines,
  );

  return await getScheduleById(id);
}

export async function deleteSchedule(id: string) {
  await getScheduleById(id);

  const refs = await schedulesRepo.countScheduleReferences(id);
  if (refs.employees > 0 || refs.contracts > 0) {
    throw new ConflictError(
      `Cannot delete working schedule: assigned to ${refs.employees} employee(s) and ${refs.contracts} contract(s)`,
    );
  }

  await schedulesRepo.deleteSchedule(id);
  return { success: true, message: 'Working schedule deleted successfully' };
}
