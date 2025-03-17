/**
 * FateTicketテーブルにevent_date_idカラムを追加するための型定義更新
 * 
 * このファイルは、Supabaseの型定義を手動で更新するためのものです。
 * 実際には `npx supabase gen types typescript --project-id YOUR_PROJECT_ID` を実行して
 * 最新のデータベース構造から型定義を生成することをお勧めします。
 */

// src/types/database.types.ts の該当部分を以下のように更新してください

/*
// FateTicketテーブルの型定義更新例
FateTicket: {
  Row: {
    id: string
    batch_id: string
    shop_id: string
    event_id: string
    event_date_id: string | null // 新しく追加されたフィールド
    fate_position: number | null
    status: string
    is_drawn: boolean
    drawn_at: string | null
    drawn_by_id: string | null
    deleted_at: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    batch_id: string
    shop_id: string
    event_id: string
    event_date_id?: string | null // 新しく追加されたフィールド
    fate_position?: number | null
    status: string
    is_drawn?: boolean
    drawn_at?: string | null
    drawn_by_id?: string | null
    deleted_at?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    batch_id?: string
    shop_id?: string
    event_id?: string
    event_date_id?: string | null // 新しく追加されたフィールド
    fate_position?: number | null
    status?: string
    is_drawn?: boolean
    drawn_at?: string | null
    drawn_by_id?: string | null
    deleted_at?: string | null
    created_at?: string
    updated_at?: string
  }
}
*/

// 注意: このファイルは参考用です。実際の型定義更新は、Supabaseの型生成コマンドを使用するか、
// src/types/database.types.ts を直接編集してください。 