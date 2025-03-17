import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import ClientWrapper from "./ClientWrapper";

// Event型を定義
type Event = Database['public']['Tables']['Event']['Row'] & {
  EventDate: Database['public']['Tables']['EventDate']['Row'][]
};

export default async function NewShopPage() {
  // イベント一覧を取得
  let events: Event[] = [];
  let errorMessage = null;

  try {
    const supabase = await createSupabaseServerClient();

    // イベントの一覧を取得
    const { data, error } = await supabase
      .from("Event")
      .select("*, EventDate(*)");

    if (error) {
      console.error("Error fetching events:", error.message);
      errorMessage = `イベントデータの取得中にエラーが発生しました: ${error.message}`;
    } else {
      events = data || [];
    }
  } catch (err) {
    console.error("Error fetching events:", err);
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

  return <ClientWrapper events={events} />;

}