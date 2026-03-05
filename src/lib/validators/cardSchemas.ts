import { z } from 'zod'

export const CreateCardSchema = z.object({
  columnId: z.string().uuid('Invalid column ID'),
  boardId: z.string().uuid('Invalid board ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be ≤ 255 characters').trim(),
  description: z
    .string()
    .max(5000, 'Description must be ≤ 5000 characters')
    .optional(),
})

export const UpdateCardSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be ≤ 255 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, 'Description must be ≤ 5000 characters')
    .nullable()
    .optional(),
})

export const MoveCardSchema = z.object({
  columnId: z.string().uuid('Invalid column ID'),
  position: z.number().int().min(0, 'Position must be ≥ 0'),
})

export const AssignCardSchema = z.object({
  assigneeId: z.string().uuid('Invalid user ID').nullable(),
})

export type CreateCardInput = z.infer<typeof CreateCardSchema>
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>
export type MoveCardInput = z.infer<typeof MoveCardSchema>
export type AssignCardInput = z.infer<typeof AssignCardSchema>
