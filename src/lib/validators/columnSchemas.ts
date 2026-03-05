import { z } from 'zod'

export const CreateColumnSchema = z.object({
  boardId: z.string().uuid('Invalid board ID'),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be ≤ 50 characters').trim(),
})

export const UpdateColumnSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be ≤ 50 characters').trim(),
})

export const ReorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()).min(1, 'At least one column ID required'),
})

export type CreateColumnInput = z.infer<typeof CreateColumnSchema>
export type UpdateColumnInput = z.infer<typeof UpdateColumnSchema>
export type ReorderColumnsInput = z.infer<typeof ReorderColumnsSchema>
