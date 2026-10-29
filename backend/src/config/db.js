import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from './env.js'
export const client = createClient({ url: env.databaseUrl, authToken: env.authToken })
export const db = drizzle(client)
