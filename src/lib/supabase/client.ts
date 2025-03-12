"use client"

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const createSupabaseBrowserClient = () => {
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          // サーバーサイドでの実行時はdocumentがないため空文字を返す
          if (typeof document === 'undefined') {
            return ''
          }
          
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : ''
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          // サーバーサイドでの実行時は何もしない
          if (typeof document === 'undefined') {
            return
          }

          let cookie = `${name}=${value}`
          if (options.path) {
            cookie += `; path=${options.path}`
          }
          if (options.maxAge) {
            cookie += `; max-age=${options.maxAge}`
          }
          document.cookie = cookie
        },
        remove(name: string, options: { path?: string }) {
          document.cookie = `${name}=; max-age=0${options.path ? `; path=${options.path}` : ''}`
        }
      }
    }
  )
}

// クライアントコンポーネントで使用するためのクライアントインスタンス
export const supabaseBrowser = createSupabaseBrowserClient()