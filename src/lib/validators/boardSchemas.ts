import { z } from 'zod'

export const CreateBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be ≤ 100 characters').trim(),
})

export const UpdateBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be ≤ 100 characters').trim(),
})

export const AddBoardMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>
export type AddBoardMemberInput = z.infer<typeof AddBoardMemberSchema>
