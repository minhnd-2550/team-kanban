import { describe, it, expect } from 'vitest'
import { CreateCardSchema, UpdateCardSchema, MoveCardSchema } from '@/lib/validators/cardSchemas'

const uuid = '123e4567-e89b-12d3-a456-426614174000'
const uuid2 = '223e4567-e89b-12d3-a456-426614174001'

describe('cardSchemas', () => {
  describe('CreateCardSchema', () => {
    it('accepts a valid card', () => {
      const result = CreateCardSchema.safeParse({ columnId: uuid, boardId: uuid2, title: 'My Card' })
      expect(result.success).toBe(true)
    })

    it('rejects an empty title', () => {
      const result = CreateCardSchema.safeParse({ columnId: uuid, boardId: uuid2, title: '' })
      expect(result.success).toBe(false)
    })

    it('accepts optional description', () => {
      const result = CreateCardSchema.safeParse({
        columnId: uuid,
        boardId: uuid2,
        title: 'Card',
        description: 'Some description',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('MoveCardSchema', () => {
    it('accepts a valid move', () => {
      const result = MoveCardSchema.safeParse({ columnId: uuid, position: 0 })
      expect(result.success).toBe(true)
    })

    it('rejects negative position', () => {
      const result = MoveCardSchema.safeParse({ columnId: uuid, position: -1 })
      expect(result.success).toBe(false)
    })
  })
})
