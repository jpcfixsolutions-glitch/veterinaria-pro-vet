import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../utils/http.js'
export function authenticate(req, _res, next) { const token = req.headers.authorization?.replace('Bearer ', ''); if (!token) return next(new AppError('Autenticación requerida.', 401)); try { req.user = jwt.verify(token, env.jwtSecret); next() } catch { next(new AppError('Sesión inválida o vencida.', 401)) } }
