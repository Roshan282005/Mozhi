import { describe, it, expect } from 'vitest'

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

describe('generateId', () => {
  it('should generate a valid UUID v4 format', () => {
    const id = generateId()
    
    // Check format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    expect(id).toMatch(uuidRegex)
  })

  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should contain only hexadecimal characters', () => {
    const id = generateId()
    const hexRegex = /^[0-9a-f-]+$/
    expect(id).toMatch(hexRegex)
  })
})

describe('Login validation', () => {
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  it('should validate correct email format', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.co.uk')).toBe(true)
  })

  it('should reject invalid email format', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@domain.com')).toBe(false)
  })
})

describe('Password validation', () => {
  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  it('should accept password with 8+ characters', () => {
    expect(validatePassword('password123')).toBe(true)
    expect(validatePassword('12345678')).toBe(true)
  })

  it('should reject password with less than 8 characters', () => {
    expect(validatePassword('short')).toBe(false)
    expect(validatePassword('1234567')).toBe(false)
  })
})