import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import React from "react";
import type { ShopAttendance } from "@/types/shopAttendance";

// クライアントコンポーネントをインポートするための境界コンポーネントをインポート
import ClientBoundary from "./ClientBoundary";

// 型定義
type Shop = Database['public']['Tables']['Shop']['Row'];
type EventDate = Database['public']['Tables']['EventDate']['Row'];
type Event = Database['public']['Tables']['Event']['Row'] & {
  EventDate: EventDate[]
};

export default async function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
  // paramsをawaitしてから使用する
  const unwrappedParams = await params;
  const shopId = unwrappedParams.id;

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
        
        // ShopAttendanceテーブルから出店情報を取得
        const { data: shopAttendances, error: attendanceError } = await supabase
          .from("ShopAttendance")
          .select("*")
          .eq("shop_id", shopId)
          .is("deleted_at", null);
          
        if (attendanceError) {
          console.error("Error fetching shop attendances:", attendanceError.message);
        } else if (shopAttendances && shopAttendances.length > 0) {
          // 最初の出店情報からイベント日程IDを取得
          const eventDateId = shopAttendances[0].event_date_id;
          
          // イベント日程からイベントIDを取得
          const { data: eventDateData, error: eventDateError } = await supabase
            .from("EventDate")
            .select("event_id")
            .eq("id", eventDateId)
            .single();
            
          if (eventDateError) {
            console.error("Error fetching event date:", eventDateError.message);
          } else if (eventDateData) {
            const eventId = eventDateData.event_id;
            
            // 関連するイベントを検索
            event = events.find(e => e.id === eventId) || null;
            console.log("Found related event:", event?.name);
          }
        }
        
        // 関連するイベントが見つからない場合は最初のイベントを使用
        if (!event && events.length > 0) {
          event = events[0];
          console.log("Using default event:", event.name);
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
