import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from '../../config/system.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET)
}

export const generateRandomString = () => {
    return crypto.randomBytes(32).toString('hex')
}