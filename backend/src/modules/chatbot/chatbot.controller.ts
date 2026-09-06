import type { Request, Response } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import * as chatbotService from './chatbot.service';
import { chatMessageSchema, executeActionSchema } from './chatbot.validators';
import { UnauthorizedError } from '../../shared/errors';

export const handleChatMessage = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const validatedInput = chatMessageSchema.parse(req.body);
    const response = await chatbotService.processUserMessage(validatedInput, req.user);
    res.status(200).json(response);
  },
);

export const executeAction = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const validatedInput = executeActionSchema.parse(req.body);
    const result = await chatbotService.executeAction(validatedInput, req.user);
    res.status(200).json(result);
  },
);

export const getQuickInsights = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const insights = await chatbotService.getQuickInsights(req.user);
    res.status(200).json(insights);
  },
);

export const getSuggestions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const suggestions = chatbotService.getSuggestions(req.user);
    res.status(200).json({ suggestions });
  },
);
