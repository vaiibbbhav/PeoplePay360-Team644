import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import {
  validateCreateSchedule,
  validateUpdateSchedule,
} from './schedules.validators';
import * as schedulesService from './schedules.service';

export const listSchedules = asyncHandler(async (_req: Request, res: Response) => {
  const schedules = await schedulesService.listSchedules();
  res.json(schedules);
});

export const getScheduleById = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await schedulesService.getScheduleById(req.params.id);
  res.json(schedule);
});

export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const validated = validateCreateSchedule(req.body);
  const created = await schedulesService.createSchedule(validated);
  res.status(201).json(created);
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
  const validated = validateUpdateSchedule(req.body);
  const updated = await schedulesService.updateSchedule(req.params.id, validated);
  res.json(updated);
});

export const deleteSchedule = asyncHandler(async (req: Request, res: Response) => {
  const result = await schedulesService.deleteSchedule(req.params.id);
  res.json(result);
});
