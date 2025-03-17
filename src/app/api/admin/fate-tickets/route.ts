import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// リクエストの型定義
type GetFateTicketsRequest = {
  event_id: string;
  event_date_id: string;
  page: number;
  pageSize: number;
};

export async function POST(request: Request) {
  try {
    // リクエストボディの取得
    const body: GetFateTicketsRequest = await request.json();
    const { event_id, event_date_id, page = 1, pageSize = 10 } = body;

    // バリデーション
    if (!event_id || !event_date_id) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // ページネーションの設定
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // RLSをバイパスするためにサービスロールを使用
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // FateTicketデータを取得（Shop情報を結合）
    const { data: tickets, error, count } = await supabaseAdmin
      .from("FateTicket")
      .select(`
        *,
        Shop (
          shop_name,
          shop_code
        )
      `, { count: 'exact' })
      .eq("event_id", event_id)
      .eq("event_date_id", event_date_id)
      .is("deleted_at", null)
      .eq("status", "active")
      .order('batch_id', { ascending: true })
      .order('fate_position', { ascending: true })
      .range(from, to);

    if (error) {
      console.error("チケット取得エラー:", error);
      return NextResponse.json(
        { error: "チケットの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tickets: tickets || [],
        totalCount: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error("チケット取得エラー:", error);
    return NextResponse.json(
      { error: "チケットの取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 