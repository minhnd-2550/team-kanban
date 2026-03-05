import { describe, it, expect } from 'vitest'
import { CreateCommentSchema } from '@/lib/validators/commentSchemas'

describe('commentSchemas', () => {
  describe('CreateCommentSchema', () => {
    it('accepts a valid comment body', () => {
      const result = CreateCommentSchema.safeParse({ body: 'Hello world' })
      expect(result.success).toBe(true)
    })

    it('rejects an empty body', () => {
      const result = CreateCommentSchema.safeParse({ body: '' })
      expect(result.success).toBe(false)
    })

    it('rejects a body over 2000 characters', () => {
      const result = CreateCommentSchema.safeParse({ body: 'a'.repeat(2001) })
      expect(result.success).toBe(false)
    })

    it('accepts exactly 2000 characters', () => {
      const result = CreateCommentSchema.safeParse({ body: 'a'.repeat(2000) })
      expect(result.success).toBe(true)
    })
  })
})
