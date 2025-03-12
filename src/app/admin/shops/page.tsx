import { ShopsClient } from "./ShopsClient";
import type { Database } from "@/types/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ShopsPage() {
  let shops = [];
  let errorMessage = null;

  try {
    // 新しいSupabaseクライアント作成方法を使用
    const supabase = await createSupabaseServerClient();

    // Supabaseから出店者データを取得
    const { data, error } = await supabase
      .from("Shop")
      .select("*")
      .order("shop_number");

    if (error) {
      console.error("Error fetching shops:", error.message);
      errorMessage = `データの取得中にエラーが発生しました: ${error.message}`;
    } else {
      shops = data || [];
    }
  } catch (err) {
    console.error("Error fetching shops:", err);
    errorMessage = "データの取得中に予期せぬエラーが発生しました。ネットワーク接続を確認してください。";
  }

  if (errorMessage) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">エラー</h2>
        <p className="mt-1 text-red-600">{errorMessage}</p>
        <p className="mt-3 text-sm text-gray-600">管理者に連絡するか、後ほど再度お試しください。</p>
      </div>
    );
  }

  return <ShopsClient initialShops={shops} />;
}