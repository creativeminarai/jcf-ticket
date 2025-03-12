import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Shop, Event } from "@/types/database.types";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// クライアントコンポーネントをインポートするための境界コンポーネントをインポート
import ClientBoundary from "./ClientBoundary";

export default async function EditShopPage({ params }: { params: { id: string } }) {
  const shopId = params.id;

  // 出店者情報を取得
  let shop: Shop | null = null;
  let event: Event | null = null;
  let events: Event[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();

    // 出店者の詳細を取得
    const { data: shopData, error: shopError } = await supabase
      .from("Shop")
      .select("*")
      .eq("id", shopId)
      .single();

    if (shopError) {
      console.error("Error fetching shop:", shopError.message);
      errorMessage = `出店者データの取得中にエラーが発生しました: ${shopError.message}`;
    } else if (!shopData) {
      return notFound();
    } else {
      shop = shopData as Shop;

      // すべてのイベントを取得
      const { data: eventsData, error: eventsError } = await supabase
        .from("Event")
        .select("*, EventDate(*)");

      if (eventsError) {
        console.error("Error fetching events:", eventsError.message);
      } else if (eventsData) {
        events = eventsData as Event[];
        
        // 現在データベース設計ではShopとEventの関連を取得する方法がないため
        // 仮に最初のイベントを関連イベントとして設定
        if (events.length > 0) {
          event = events[0];
        }
      }
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

  return (
    <Suspense fallback={<div className="p-4">読み込み中...</div>}>
      <ClientBoundary shop={shop} event={event} events={events} />
    </Suspense>
  );
}
