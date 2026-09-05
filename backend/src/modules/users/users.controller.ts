import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import * as usersService from './users.service';
import { createUserSchema, updateUserSchema, userQuerySchema } from './users.validators';

export const listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = userQuerySchema.parse(req.query);
  const users = await usersService.listUsers(query);
  res.json(users);
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.getUserById(req.params.id);
  res.json(user);
});

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = createUserSchema.parse(req.body);
  const user = await usersService.createUser(validated);
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validated = updateUserSchema.parse(req.body);
  const user = await usersService.updateUser(req.params.id, validated);
  res.json(user);
});

export const getEmployeeOptions = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const employees = await usersService.getEmployeeOptions();
    res.json(employees);
  },
);
export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await usersService.deleteUser(req.params.id, req.user?.id);
  res.status(204).send();
});
