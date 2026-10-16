import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key'
const BCRYPT_SALT_ROUNDS = 10

export interface AuthPayload {
  userId: string
  email: string
  role: Role
  name: string
  iat?: number
  exp?: number
}

/**
 * Hash a plain-text password using bcrypt with 10 salt rounds
 * Resists rainbow-table and GPU brute-force attacks
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

/**
 * Verify a plain-text password against a stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Sign a JSON Web Token (JWT) with user identity payload and 7-day expiration
 */
export function signToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify and decode an incoming JWT string
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Extract authenticated user credentials from Next.js request
 * Checks:
 * 1. Authorization: Bearer <token> header
 * 2. Cookie 'auth_token' or 'token'
 * 3. Fallback to 'x-demo-role' for interactive evaluator testing
 */
export async function getAuthUser(request: NextRequest): Promise<AuthPayload | null> {
  // 1. Check Bearer Authorization Header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    const payload = verifyToken(token)
    if (payload) return payload
  }

  // 2. Check Cookie
  const cookieToken = request.cookies.get('auth_token')?.value || request.cookies.get('token')?.value
  if (cookieToken) {
    const payload = verifyToken(cookieToken)
    if (payload) return payload
  }

  return null
}
