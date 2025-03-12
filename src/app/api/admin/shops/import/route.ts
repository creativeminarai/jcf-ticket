import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { parse } from "csv-parse/sync";

type ShopRow = {
  shop_code: string;
  shop_name: string;
  coffee_name: string;
  greeting: string;
  roast_level: string;
  pr_url: string;
  destiny_ratio: number;
  ticket_count: number;
  notes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 400 }
      );
    }

    // ファイルの内容を文字列として読み取り
    const fileContent = await file.text();

    // CSVをパース
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // バリデーションと型変換
    const shops: ShopRow[] = records.map((record: any) => {
      if (!record.shop_code || !record.shop_name) {
        throw new Error("店舗番号と店舗名は必須です");
      }

      return {
        shop_code: record.shop_code,
        shop_name: record.shop_name,
        coffee_name: record.coffee_name || "",
        greeting: record.greeting || "",
        roast_level: record.roast_level || "",
        pr_url: record.pr_url || "",
        destiny_ratio: parseFloat(record.destiny_ratio || "0"),
        ticket_count: parseInt(record.ticket_count || "0", 10),
        notes: record.notes,
      };
    });

    // Supabaseに一括挿入
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.from("shops").upsert(
      shops.map((shop) => ({
        ...shop,
        // 同じshop_codeの場合は更新
        shop_code: shop.shop_code,
      })),
      {
        onConflict: "shop_code",
      }
    );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "データの保存に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "CSVの処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}