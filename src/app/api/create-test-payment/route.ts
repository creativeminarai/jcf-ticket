import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  console.log("Create Test Payment API called");
  try {
    // リクエストボディからデータを取得
    const { eventId, eventName, ticketPrice } = await req.json();
    console.log("Request data:", { eventId, eventName, ticketPrice });
    
    // テスト用のユーザーID（実際のリクエストから取得するか、テスト用の固定値を使用）
    const userId = req.headers.get("x-user-id") || "02181e5c-35b8-4a79-91ff-153aab110016"; // テスト用のユーザーID
    console.log("Using user ID for test:", userId);
    
    // テスト用のPayment Intentを作成
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: ticketPrice,
        currency: 'jpy',
        payment_method_types: ['card'],
        metadata: {
          userId,
          eventId,
          isTestMode: 'true'
        }
      });
      
      console.log("Test payment intent created:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      });
      
      return new NextResponse(
        JSON.stringify({ 
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        }),
        { status: 200 }
      );
    } catch (stripeError) {
      console.error("Stripe API error:", stripeError);
      
      // Stripe APIエラーの場合、テスト用のIDを生成
      const mockPaymentIntentId = `pi_mock_${Date.now()}`;
      console.log("Using mock payment intent ID:", mockPaymentIntentId);
      
      return new NextResponse(
        JSON.stringify({ 
          paymentIntentId: mockPaymentIntentId,
          status: "succeeded",
          isMock: true
        }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("テスト決済作成エラー:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "テスト決済の作成に失敗しました",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500 }
    );
  }
} 