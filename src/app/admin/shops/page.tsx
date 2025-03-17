import { ShopsClient } from "./ShopsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Event } from "@/types/shop";

export default async function ShopsPage() {
  let shops = [];
  let events = [];
  let errorMessage = null;

  try {
    // 新しいSupabaseクライアント作成方法を使用
    const supabase = await createSupabaseServerClient();

    // Supabaseから出店者データとイベントデータを取得
    const [shopsResponse, eventsResponse] = await Promise.all([
      supabase
        .from("Shop")
        .select("*")
        .order("shop_code"),
      supabase
        .from("Event")
        .select("*, EventDate(*)")
        .order("event_number", { ascending: false })
    ]);

    if (shopsResponse.error) {
      console.error("Error fetching shops:", shopsResponse.error.message);
      errorMessage = `出店者データの取得中にエラーが発生しました: ${shopsResponse.error.message}`;
    } else if (eventsResponse.error) {
      console.error("Error fetching events:", eventsResponse.error.message);
      errorMessage = `イベントデータの取得中にエラーが発生しました: ${eventsResponse.error.message}`;
    } else {
      shops = shopsResponse.data || [];
      events = eventsResponse.data || [];
    }
  } catch (err) {
    console.error("Error fetching data:", err);
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

  return <ShopsClient initialShops={shops} events={events} />;
}