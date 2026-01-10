import { cookies } from 'next/headers'

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')
  return token ? { isAuthenticated: true, token: token.value } : null
}

export async function setSession(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, { httpOnly: true, secure: true })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}
