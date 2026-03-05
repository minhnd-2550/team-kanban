import { z } from 'zod'

export const CreateCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment must be ≤ 2000 characters').trim(),
})

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>
