import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Stripe初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// UUIDの形式を検証する関数
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export async function POST(req: NextRequest) {
  console.log("Checkout API called");
  try {
    // リクエストボディからデータを取得
    const { eventId, eventName, ticketPrice } = await req.json();
    console.log("Request data:", { eventId, eventName, ticketPrice });
    
    // 認証情報を取得
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.error("No authenticated user found");
      return new NextResponse(
        JSON.stringify({ error: "認証されていません" }),
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    console.log("Authenticated user:", userId);
    
    // UUIDの形式を検証
    if (!isValidUUID(userId)) {
      console.error("Invalid userId format:", userId);
      return new NextResponse(
        JSON.stringify({ error: "無効なユーザーIDです" }),
        { status: 400 }
      );
    }
    
    if (!isValidUUID(eventId)) {
      console.error("Invalid eventId format:", eventId);
      return new NextResponse(
        JSON.stringify({ error: "無効なイベントIDです" }),
        { status: 400 }
      );
    }
    
    // 当日券のチケットタイプIDを取得
    const { data: ticketTypeData, error: ticketTypeError } = await supabase
      .from("TicketType")
      .select("id")
      .eq("ticket_category", "当日券")
      .single();
      
    if (ticketTypeError) {
      console.error("チケットタイプの取得に失敗:", ticketTypeError);
      return new NextResponse(
        JSON.stringify({ error: "チケットタイプの取得に失敗しました" }),
        { status: 500 }
      );
    }
    
    const ticketTypeId = ticketTypeData.id;
    console.log("Ticket type ID:", ticketTypeId);
    
    // UUIDの形式を検証
    if (!isValidUUID(ticketTypeId)) {
      console.error("Invalid ticketTypeId format:", ticketTypeId);
      return new NextResponse(
        JSON.stringify({ error: "無効なチケットタイプIDです" }),
        { status: 400 }
      );
    }
    
    // 参照整合性チェック
    // イベントが存在するか確認
    const { data: eventData, error: eventError } = await supabase
      .from("Event")
      .select("id")
      .eq("id", eventId)
      .single();
      
    if (eventError || !eventData) {
      console.error("Event not found:", eventId, eventError);
      return new NextResponse(
        JSON.stringify({ error: "指定されたイベントが見つかりません" }),
        { status: 400 }
      );
    }
    
    // キャンセルURLとリダイレクトURLを設定
    const origin = req.headers.get("origin") || "http://localhost:3000";
    console.log("Origin for redirect URLs:", origin);
    
    // メタデータの設定
    const metadata = {
      userId,
      eventId,
      ticketTypeId,
    };
    console.log("Setting metadata:", metadata);
    
    // チェックアウトセッションを作成
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: eventName,
              description: "イベント入場チケット",
            },
            unit_amount: ticketPrice,
          },
          quantity: 1,
        },
      ],
      metadata,
      mode: "payment",
      success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
    });
    
    // セッションIDをログに出力（デバッグ用）
    console.log("Stripe checkout session created:", {
      sessionId: checkoutSession.id,
      paymentIntent: checkoutSession.payment_intent,
      url: checkoutSession.url,
      metadata: checkoutSession.metadata
    });
    
    // 注意: PurchaseHistoryへのレコード作成はここでは行わない
    // 決済完了後のWebhookでのみレコードを作成する
    
    return new NextResponse(
      JSON.stringify({ url: checkoutSession.url }),
      { status: 200 }
    );
  } catch (error) {
    console.error("チェックアウトセッション作成エラー:", error);
    return new NextResponse(
      JSON.stringify({ error: "決済の準備に失敗しました" }),
      { status: 500 }
    );
  }
} 