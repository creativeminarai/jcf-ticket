import { EventsClient } from "./EventsClient";
import type { EventWithDates } from "@/types/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  let events: EventWithDates[] = [];
  let errorMessage: string | null = null;

  try {
    // 新しいSupabaseクライアント作成方法を使用
    const supabase = await createSupabaseServerClient();

    // Supabaseからイベントデータを取得
    // EventテーブルとEventDateテーブルを直接結合して取得
    const { data, error } = await supabase
      .from("Event")
      .select(`
        *,
        EventVenue(*)
      `);

    // イベントデータが取得できた場合、各イベントの日付情報も取得する
    if (!error && data && data.length > 0) {
      // 全イベントのIDを取得
      const eventIds = data.map(event => event.id);
      
      // イベント日付情報を取得
      const { data: eventDates, error: eventDatesError } = await supabase
        .from("EventDate")
        .select('*')
        .in('event_id', eventIds);
        
      if (eventDatesError) {
        console.error("Error fetching event dates:", eventDatesError.message);
      } else if (eventDates) {
        // 各イベントに日付情報を結合する
        data.forEach(event => {
          event.EventDate = eventDates.filter(date => date.event_id === event.id);
        });
        
        // イベントを開催日初日の昇順でソート
        data.sort((a, b) => {
          // 各イベントの開始日を取得
          const getStartDate = (event: any) => {
            if (!event.EventDate || event.EventDate.length === 0) {
              return new Date(8640000000000000); // 遠い未来の日付（日付不明の場合は最後に表示）
            }
            
            // 日付を日付順にソート
            const sortedDates = [...event.EventDate].sort((dateA, dateB) => {
              return new Date(dateA.date).getTime() - new Date(dateB.date).getTime();
            });
            
            return new Date(sortedDates[0].date);
          };
          
          const aStartDate = getStartDate(a);
          const bStartDate = getStartDate(b);
          
          return aStartDate.getTime() - bStartDate.getTime();
        });
      }
    }

    if (error) {
      console.error("Error fetching events:", error.message);
      errorMessage = `データの取得中にエラーが発生しました: ${error.message}`;
    } else {
      events = data || [];
      
      // デバッグ用にデータ構造をログ出力
      console.log("Fetched events data structure:", JSON.stringify(events[0], null, 2));
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

  return <EventsClient initialEvents={events} />;
}