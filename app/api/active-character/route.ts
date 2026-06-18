import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ACTIVE_CHARACTER_COOKIE } from '@/lib/characters'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ACTIVE_CHARACTER_COOKIE)?.value
  const id = raw ? decodeURIComponent(raw) : null
  return NextResponse.json({ id })
}

export async function POST(request: Request) {
  let body: { id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const id = body.id?.trim()
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true, id })
  response.cookies.set(ACTIVE_CHARACTER_COOKIE, id, {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  return response
}
