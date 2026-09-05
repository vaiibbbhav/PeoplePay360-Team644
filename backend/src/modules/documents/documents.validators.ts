import { z } from 'zod';

export const acceptPolicySchema = z.object({
  policyVersion: z.string().min(1).default('1.0'),
});

export type AcceptPolicyInput = z.infer<typeof acceptPolicySchema>;
