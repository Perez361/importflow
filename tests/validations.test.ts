import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  productSchema,
  customerSchema,
  validateFormData,
} from '../lib/validations'

describe('Login Validation', () => {
  it('should validate correct email and password', () => {
    const result = validateFormData(loginSchema, {
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = validateFormData(loginSchema, {
      email: 'invalid-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.email).toBeDefined()
    }
  })

  it('should reject short password', () => {
    const result = validateFormData(loginSchema, {
      email: 'test@example.com',
      password: '123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.password).toBeDefined()
    }
  })
})

describe('Register Validation', () => {
  it('should validate correct registration data', () => {
    const result = validateFormData(registerSchema, {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      full_name: 'John Doe',
      business_name: 'Doe Imports',
    })
    expect(result.success).toBe(true)
  })

  it('should reject mismatched passwords', () => {
    const result = validateFormData(registerSchema, {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different',
      full_name: 'John Doe',
      business_name: 'Doe Imports',
    })
    expect(result.success).toBe(false)
  })
})

describe('Product Validation', () => {
  it('should validate correct product data', () => {
    const result = validateFormData(productSchema, {
      name: 'Test Product',
      selling_price: 100,
      quantity: 10,
      low_stock_threshold: 5,
    })
    expect(result.success).toBe(true)
  })

  it('should reject negative price', () => {
    const result = validateFormData(productSchema, {
      name: 'Test Product',
      selling_price: -10,
      quantity: 10,
      low_stock_threshold: 5,
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative quantity', () => {
    const result = validateFormData(productSchema, {
      name: 'Test Product',
      selling_price: 100,
      quantity: -5,
      low_stock_threshold: 5,
    })
    expect(result.success).toBe(false)
  })
})

describe('Customer Validation', () => {
  it('should validate correct customer data', () => {
    const result = validateFormData(customerSchema, {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+233501234567',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = validateFormData(customerSchema, {
      name: 'John Doe',
      email: 'invalid-email',
    })
    expect(result.success).toBe(false)
  })

  it('should allow optional email', () => {
    const result = validateFormData(customerSchema, {
      name: 'John Doe',
    })
    expect(result.success).toBe(true)
  })
})

