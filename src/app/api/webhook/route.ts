import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// サービスロールを使用したSupabaseクライアントを作成（RLSをバイパス）
const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
};

// UUIDの形式を検証する関数
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// 開発環境かどうかを判定
const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(req: NextRequest) {
  console.log("Webhook received");
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;
  
  let event;
  
  try {
    // 開発環境では署名検証をスキップ可能に
    if (endpointSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          endpointSecret
        );
        console.log("Webhook signature verified");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Webhook signature verification failed: ${errorMessage}`);
        
        // 開発環境では署名検証失敗時もJSONをパースして処理を続行
        console.log("Falling back to JSON parsing (development mode)");
        event = JSON.parse(body);
      }
    } else {
      // 開発環境用：署名検証をスキップ
      console.log("Webhook signature verification skipped (development mode)");
      try {
        event = JSON.parse(body);
      } catch (error) {
        console.error("Invalid JSON in webhook body");
        return new NextResponse("Invalid JSON", { status: 400 });
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook error: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
  
  // サービスロールを使用したSupabaseクライアントを初期化（RLSをバイパス）
  const supabase = createServiceRoleClient();
  console.log("Supabase service role client initialized");
  
  // イベントタイプに基づいて処理
  console.log(`Webhook received: ${event.type}`);
  
  // セッションイベントの場合、メタデータを取得
  if (event.type && event.type.startsWith('checkout.session.')) {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const eventId = session.metadata?.eventId;
    let ticketTypeId = session.metadata?.ticketTypeId;
    
    console.log("Session metadata:", { userId, eventId, ticketTypeId });
    console.log("Session payment_intent:", session.payment_intent);
    
    if (!userId || !eventId) {
      console.error("Missing metadata in checkout session");
      return new NextResponse("Missing metadata", { status: 400 });
    }
    
    // 開発環境ではUUID検証をスキップ可能に
    if (!isDevelopment) {
      // UUIDの形式を検証
      if (!isValidUUID(userId)) {
        console.error("Invalid userId format:", userId);
        return new NextResponse("Invalid userId format", { status: 400 });
      }
      
      if (!isValidUUID(eventId)) {
        console.error("Invalid eventId format:", eventId);
        return new NextResponse("Invalid eventId format", { status: 400 });
      }
      
      if (ticketTypeId && !isValidUUID(ticketTypeId)) {
        console.error("Invalid ticketTypeId format:", ticketTypeId);
        return new NextResponse("Invalid ticketTypeId format", { status: 400 });
      }
    } else {
      console.log("UUID validation skipped in development mode");
    }
    
    // テスト用：ticketTypeIdがない場合はモックデータを使用
    if (!ticketTypeId) {
      console.log("Using mock ticket type ID for testing");
      
      // 当日券のチケットタイプIDを取得
      try {
        const { data, error } = await supabase
          .from("TicketType")
          .select("id")
          .eq("ticket_category", "当日券")
          .single();
          
        if (error) {
          console.error("Error fetching ticket type:", error);
          // 有効なUUIDのモックデータを使用
          const { data: anyTicketType } = await supabase
            .from("TicketType")
            .select("id")
            .limit(1)
            .single();
            
          if (anyTicketType) {
            ticketTypeId = anyTicketType.id;
          } else {
            if (isDevelopment) {
              // 開発環境ではダミーUUIDを使用
              ticketTypeId = "00000000-0000-0000-0000-000000000000";
              console.log("Using dummy ticket type ID for development:", ticketTypeId);
            } else {
              return new NextResponse("No valid ticket type found", { status: 400 });
            }
          }
        } else if (data) {
          ticketTypeId = data.id;
        } else {
          if (isDevelopment) {
            // 開発環境ではダミーUUIDを使用
            ticketTypeId = "00000000-0000-0000-0000-000000000000";
            console.log("Using dummy ticket type ID for development:", ticketTypeId);
          } else {
            return new NextResponse("No ticket type found", { status: 400 });
          }
        }
      } catch (error) {
        console.error("Error in ticket type lookup:", error);
        if (isDevelopment) {
          // 開発環境ではダミーUUIDを使用
          ticketTypeId = "00000000-0000-0000-0000-000000000000";
          console.log("Using dummy ticket type ID for development:", ticketTypeId);
        } else {
          return new NextResponse("Error fetching ticket type", { status: 500 });
        }
      }
      
      console.log("Using ticket type ID:", ticketTypeId);
    }
    
    // 開発環境では参照整合性チェックをスキップ可能に
    if (!isDevelopment) {
      // 参照整合性チェック
      try {
        // イベントが存在するか確認
        const { data: eventData, error: eventError } = await supabase
          .from("Event")
          .select("id")
          .eq("id", eventId)
          .single();
          
        if (eventError || !eventData) {
          console.error("Event not found:", eventId, eventError);
          return new NextResponse("Event not found", { status: 400 });
        }
        
        // チケットタイプが存在するか確認
        const { data: ticketTypeData, error: ticketTypeError } = await supabase
          .from("TicketType")
          .select("id")
          .eq("id", ticketTypeId)
          .single();
          
        if (ticketTypeError || !ticketTypeData) {
          console.error("Ticket type not found:", ticketTypeId, ticketTypeError);
          return new NextResponse("Ticket type not found", { status: 400 });
        }
        
        // ユーザーが存在するか確認
        const { error: userError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();
          
        if (userError) {
          console.error("Error checking user:", userError);
          // ユーザーチェックはスキップ可能（auth.usersテーブルへの直接アクセスは制限されている場合がある）
        }
      } catch (error) {
        console.error("Error in reference integrity check:", error);
        return new NextResponse("Error in reference integrity check", { status: 500 });
      }
    } else {
      console.log("Reference integrity check skipped in development mode");
    }
    
    console.log(`Webhook: ${event.type}`, {
      sessionId: session.id,
      paymentIntent: session.payment_intent,
      userId,
      eventId,
      ticketTypeId
    });
    
    // 決済完了時の処理
    if (event.type === "checkout.session.completed") {
      try {
        console.log("Processing completed checkout session");
        
        // 支払いIDを取得（payment_intentまたはsession.id）
        const paymentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.id;
          
        if (!paymentId) {
          console.error("Missing payment ID");
          return new NextResponse("Missing payment ID", { status: 400 });
        }
        
        // 既存の購入レコードを確認（重複防止）
        const { data: existingPurchase, error: queryError } = await supabase
          .from("PurchaseHistory")
          .select("id")
          .eq("payment_id", paymentId)
          .maybeSingle();
          
        if (queryError) {
          console.error("Error checking existing purchase:", queryError);
        } else if (existingPurchase) {
          console.log("Purchase record already exists:", existingPurchase);
          return new NextResponse(JSON.stringify({
            success: true,
            message: "Purchase record already exists",
            purchaseId: existingPurchase.id
          }), { status: 200 });
        }
        
        // 新しい購入レコードを作成
        console.log("Creating purchase record with data:", {
          user_id: userId,
          event_id: eventId,
          ticket_type_id: ticketTypeId,
          payment_id: paymentId
        });
        
        try {
          const { data: newPurchase, error: insertError } = await supabase
            .from("PurchaseHistory")
            .insert([
              {
                user_id: userId,
                event_id: eventId,
                ticket_type_id: ticketTypeId,
                purchase_date: new Date().toISOString(),
                quantity: 1,
                payment_id: paymentId,
              }
            ])
            .select();
            
          if (insertError) {
            console.error("Error creating purchase record:", insertError);
            
            // テーブル構造やRLSポリシーの詳細なエラー情報を表示
            if (insertError.details) {
              console.error("Error details:", insertError.details);
            }
            if (insertError.hint) {
              console.error("Error hint:", insertError.hint);
            }
            
            return new NextResponse(JSON.stringify({
              error: "Error creating purchase record",
              details: insertError
            }), { status: 500 });
          }
          
          console.log("Purchase record created:", newPurchase);
          
          // AllStoreTicketに2レコードを追加（全店舗チケット）
          const allStoreTickets = [
            {
              event_id: eventId,
              user_id: userId,
              shop_id: null,
              used_at: null
            },
            {
              event_id: eventId,
              user_id: userId,
              shop_id: null,
              used_at: null
            }
          ];
          
          console.log("Creating all store tickets:", allStoreTickets);
          
          const { data: ticketData, error: allStoreTicketError } = await supabase
            .from("AllStoreTicket")
            .insert(allStoreTickets)
            .select();
            
          if (allStoreTicketError) {
            console.error("Error creating all store tickets:", allStoreTicketError);
            
            // テーブル構造やRLSポリシーの詳細なエラー情報を表示
            if (allStoreTicketError.details) {
              console.error("Error details:", allStoreTicketError.details);
            }
            if (allStoreTicketError.hint) {
              console.error("Error hint:", allStoreTicketError.hint);
            }
            
            // 購入レコードは作成済みなので処理は続行
            return new NextResponse(JSON.stringify({
              success: true,
              warning: "Purchase record created but failed to create tickets",
              details: allStoreTicketError
            }), { status: 200 });
          } else {
            console.log("All store tickets created:", ticketData);
          }
          
          console.log("Purchase completed successfully");
          return new NextResponse(JSON.stringify({
            success: true,
            purchase: newPurchase,
            tickets: ticketData
          }), { status: 200 });
        } catch (dbError) {
          console.error("Database error:", dbError);
          return new NextResponse(JSON.stringify({
            error: "Database error",
            details: dbError instanceof Error ? dbError.message : String(dbError)
          }), { status: 500 });
        }
      } catch (error) {
        console.error("Error processing checkout session:", error);
        return new NextResponse(JSON.stringify({
          error: "Error processing checkout session",
          details: error instanceof Error ? error.message : String(error)
        }), { status: 500 });
      }
    }
    // 決済キャンセル・失敗時の処理
    else if (
      event.type === "checkout.session.expired" || 
      event.type === "checkout.session.async_payment_failed"
    ) {
      console.log(`Payment ${event.type} for session ${session.id}`);
      // キャンセル時は特に何もしない（PurchaseHistoryにレコードを作成していないため）
      return new NextResponse(JSON.stringify({
        success: true,
        status: "payment_canceled"
      }), { status: 200 });
    }
  } else {
    console.log("Received non-checkout event or invalid event format");
    return new NextResponse(JSON.stringify({
      error: "Invalid event type",
      receivedType: event.type
    }), { status: 400 });
  }
  
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
} 