import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// リクエストの型定義
type DeleteFateTicketsRequest = {
  ticket_ids: string[];
};

export async function POST(request: Request) {
  try {
    // リクエストボディの取得
    const body: DeleteFateTicketsRequest = await request.json();
    const { ticket_ids } = body;

    // バリデーション
    if (!ticket_ids || ticket_ids.length === 0) {
      return NextResponse.json(
        { error: "削除するチケットIDが指定されていません" },
        { status: 400 }
      );
    }

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

    const now = new Date().toISOString();
    
    // 論理削除（deleted_atフィールドを設定）
    const { error } = await supabaseAdmin
      .from("FateTicket")
      .update({ 
        deleted_at: now, 
        updated_at: now 
      })
      .in("id", ticket_ids);

    if (error) {
      console.error("チケット削除エラー:", error);
      return NextResponse.json(
        { error: "チケットの削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${ticket_ids.length}件のチケットを削除しました`,
      data: {
        deleted_count: ticket_ids.length,
        deleted_at: now
      }
    });
  } catch (error) {
    console.error("チケット削除エラー:", error);
    return NextResponse.json(
      { error: "チケットの削除中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 