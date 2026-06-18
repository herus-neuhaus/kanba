import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'O título é obrigatório').max(100),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

export type Task = z.infer<typeof TaskSchema>;
