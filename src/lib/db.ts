import { neon } from '@neondatabase/serverless'

/**
 * Cliente Neon (HTTP serverless).
 * Cada chamada usa uma requisição HTTPS — ideal para Vercel serverless functions.
 */
export const sql = neon(process.env.DATABASE_URL!)
