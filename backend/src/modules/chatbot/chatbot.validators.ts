import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      }),
    )
    .optional()
    .default([]),
  context: z.string().max(500).optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const executeActionSchema = z.object({
  action: z.enum(['APPROVE_LEAVE']),
  payload: z.object({
    requestId: z.string().min(1, 'Request ID is required'),
  }),
});

export type ExecuteActionInput = z.infer<typeof executeActionSchema>;
