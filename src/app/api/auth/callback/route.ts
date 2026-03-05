import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Supabase Auth code exchange — called after email confirmation or OAuth redirect
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Exchange failed — redirect to error page
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
