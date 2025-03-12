import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '../../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const createServerSupabaseClient = async () => {
  const cookieStore = await import('next/headers').then(mod => mod.cookies())

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? ''
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        }
      }
    }
  )
}

// サーバーコンポーネントで使用するためのクライアントインスタンス
export const createSupabaseServerClient = async () => {
  const supabaseClient = await createServerSupabaseClient()
  return supabaseClient
}

// ミドルウェアでの認証チェックに使用
export const updateSession = async (request: Request) => {
  const response = new Response(null, {
    headers: new Headers(request.headers),
  })

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.headers.get(`cookie-${name}`) ?? ''
        },
        set(name: string, value: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=${value}`)
        },
        remove(name: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=; Max-Age=0`)
        }
      }
    }
  )

  return { supabase, response }
}
