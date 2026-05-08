import jwt, { SignOptions } from 'jsonwebtoken'
import { AuthUser } from '../types/auth.types'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET no esta definida')
  }

  return secret
}

export function signAuthToken(user: AuthUser) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h'
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] }

  return jwt.sign(user, getJwtSecret(), options)
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as AuthUser
}
