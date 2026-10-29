import { randomUUID } from 'node:crypto'
export class AppError extends Error { constructor(message, status = 400) { super(message); this.status = status } }
export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
export const id = (prefix) => `${prefix}-${randomUUID()}`
