import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/database.types";

// GET: 特定の出店者情報を取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = await context.params;

    // 出店者情報を取得
    const { data: shop, error } = await supabase
      .from("Shop")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!shop) {
      return NextResponse.json(
        { error: "出店者が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Shop fetch error:", error);
    return NextResponse.json(
      { error: "出店者情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT: 出店者情報を更新
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { id } = await context.params;
    const body = await request.json();

    // 更新するデータを準備
    const updateData = {
      shop_code: body.shopNumber,
      shop_name: body.shopName,
      coffee_name: body.coffeeName,
      greeting: body.greeting,
      roast_level: body.roastLevel,
      pr_url: body.prUrl,
      destiny_ratio: body.destinyRatio,
      ticket_count: body.ticketCount,
      image_url: body.imageUrl,
      notes: body.notes,
    };

    // データを更新
    const { data: shop, error } = await supabase
      .from("Shop")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!shop) {
      return NextResponse.json(
        { params: context.params, error: "出店者が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Shop update error:", error);
    return NextResponse.json(
      { error: "出店者情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}