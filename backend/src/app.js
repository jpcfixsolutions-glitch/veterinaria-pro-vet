import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middlewares/errors.js'
import { apiRouter } from './routes/index.js'
export const app = express()
app.use(cors({ origin: env.frontendUrl }))
app.use(express.json({ limit: '1mb' }))
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api', apiRouter)
app.use(notFound); app.use(errorHandler)
