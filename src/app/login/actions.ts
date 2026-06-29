'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSessionToken } from '@/lib/auth'

const COOKIE_NAME = 'vendas_auth'
const MAX_AGE = 60 * 60 * 24 * 365 // 1 ano — evita relogins frequentes

export async function loginAction(formData: FormData) {
  const password = formData.get('password')
  const next = (formData.get('next') as string) || '/'
  const expected = process.env.APP_PASSWORD

  if (!expected || password !== expected) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`)
  }

  const secret = process.env.AUTH_SECRET || ''
  const token = await createSessionToken(secret, MAX_AGE)

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })

  redirect(next)
}
