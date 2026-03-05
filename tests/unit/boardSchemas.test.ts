import { describe, it, expect } from 'vitest'
import { CreateBoardSchema, UpdateBoardSchema, AddBoardMemberSchema } from '@/lib/validators/boardSchemas'

describe('boardSchemas', () => {
  describe('CreateBoardSchema', () => {
    it('accepts a valid board name', () => {
      const result = CreateBoardSchema.safeParse({ name: 'My Board' })
      expect(result.success).toBe(true)
    })

    it('rejects an empty name', () => {
      const result = CreateBoardSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects a name over 100 characters', () => {
      const result = CreateBoardSchema.safeParse({ name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('trims whitespace', () => {
      const result = CreateBoardSchema.safeParse({ name: '  My Board  ' })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.name).toBe('My Board')
    })
  })

  describe('UpdateBoardSchema', () => {
    it('accepts a valid name', () => {
      const result = UpdateBoardSchema.safeParse({ name: 'Updated' })
      expect(result.success).toBe(true)
    })
  })

  describe('AddBoardMemberSchema', () => {
    it('accepts a valid email', () => {
      const result = AddBoardMemberSchema.safeParse({ email: 'user@example.com' })
      expect(result.success).toBe(true)
    })

    it('rejects an invalid email', () => {
      const result = AddBoardMemberSchema.safeParse({ email: 'not-an-email' })
      expect(result.success).toBe(false)
    })
  })
})
