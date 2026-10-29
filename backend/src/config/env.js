import 'dotenv/config'
const required = ['TURSO_DATABASE_URL', 'JWT_SECRET']
if (process.env.NODE_ENV === 'production') required.forEach((key) => { if (!process.env[key]) throw new Error(`Falta la variable ${key}`) })
export const env = { port: Number(process.env.PORT || 3001), frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173', databaseUrl: process.env.TURSO_DATABASE_URL || 'file:local.db', authToken: process.env.TURSO_AUTH_TOKEN, jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me' }
