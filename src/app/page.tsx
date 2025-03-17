"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { UserAuthMenu } from "@/components/nav/UserAuthMenu";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface EventDate {
  id: string;
  date: string;
  time: string;
}

interface Event {
  id: string;
  name: string;
  theme: string | null;
  EventDate: EventDate[];
  status: string;
  image_url: string | null;
  event_url: string | null;
  event_number: number | null;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedEvents, setPurchasedEvents] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null);

  // URLパラメータからpayment_statusを取得
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('success')) {
      setPaymentStatus('success');
      // URLからパラメータを削除（履歴に残さない）
      url.searchParams.delete('success');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
      
      // 成功メッセージを表示した後、ステータスをクリア
      setTimeout(() => {
        setPaymentStatus(null);
        // 購入履歴を更新
        if (user) {
          console.log("決済成功後に購入履歴を更新します");
          fetchPurchaseHistory(user.id);
        }
      }, 5000);
    } else if (url.searchParams.has('canceled')) {
      setPaymentStatus('canceled');
      // URLからパラメータを削除（履歴に残さない）
      url.searchParams.delete('canceled');
      window.history.replaceState({}, '', url.toString());
      
      // キャンセルメッセージを表示した後、ステータスをクリア
      setTimeout(() => {
        setPaymentStatus(null);
      }, 5000);
    }
  }, [user]);

  // 購入履歴を取得する関数
  const fetchPurchaseHistory = async (userId: string) => {
    try {
      console.log("購入履歴を取得中...", userId);
      const { data, error } = await supabaseBrowser
        .from("PurchaseHistory")
        .select("event_id")
        .eq("user_id", userId)
        .is("deleted_at", null);
        
      if (error) {
        console.error("購入履歴の取得に失敗しました:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const purchasedEventIds = new Set(data.map(purchase => purchase.event_id));
        console.log("購入済みイベント:", purchasedEventIds);
        setPurchasedEvents(purchasedEventIds);
      } else {
        console.log("購入履歴がありません");
        setPurchasedEvents(new Set());
      }
    } catch (error) {
      console.error("購入履歴の取得中にエラーが発生しました:", error);
    }
  };

  // 購入履歴を取得
  useEffect(() => {
    if (user) {
      fetchPurchaseHistory(user.id);
    }
  }, [user]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        console.log("イベントデータを取得中...");
        // supabaseBrowserを使用
        // イベント基本情報の取得
        const { data: eventsData, error: eventsError } = await supabaseBrowser
          .from("Event")
          .select(`
            id,
            name,
            theme,
            status,
            image_url,
            event_url,
            event_number
          `)
          .is("deleted_at", null)
          .eq("status", "published"); // 公開中のイベントのみ取得

        if (eventsError) {
          console.error("イベントデータ取得エラー:", eventsError);
          throw eventsError;
        }

        if (!eventsData || eventsData.length === 0) {
          console.log("取得したイベントデータがありません");
          setEvents([]);
          return;
        }

        console.log("取得したデータ:", eventsData);

        // イベントIDのリストを作成
        const eventIds = eventsData.map(event => event.id);
        
        // 各イベントに紐づく日付情報を取得
        const { data: eventDatesData, error: datesError } = await supabaseBrowser
          .from("EventDate")
          .select('id, date, time, event_id')
          .in('event_id', eventIds);
          
        if (datesError) {
          console.error("イベント日付データ取得エラー:", datesError);
        }
        
        // イベントIDをキーとした日付情報のマップを作成
        const eventDatesMap: Record<string, EventDate[]> = {};
        
        if (eventDatesData) {
          eventDatesData.forEach(dateItem => {
            if (dateItem.event_id) {
              if (!eventDatesMap[dateItem.event_id]) {
                eventDatesMap[dateItem.event_id] = [];
              }
              eventDatesMap[dateItem.event_id].push({
                id: dateItem.id,
                date: dateItem.date,
                time: dateItem.time
              });
            }
          });
        }
        
        const formattedEvents = eventsData.map(event => {
          return {
            id: event.id,
            name: event.name,
            theme: event.theme,
            status: event.status || 'published',
            image_url: event.image_url,
            event_url: event.event_url,
            event_number: event.event_number,
            EventDate: eventDatesMap[event.id] || []
          };
        });

        // イベントを開催日初日の昇順でソート
        const sortedEvents = formattedEvents.sort((a, b) => {
          // 各イベントの開始日を取得
          const getStartDate = (event: Event) => {
            if (!event.EventDate || event.EventDate.length === 0) {
              return new Date(8640000000000000); // 遠い未来の日付（日付不明の場合は最後に表示）
            }
            
            // 日付を日付順にソート
            const sortedDates = [...event.EventDate].sort((a, b) => {
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
            
            return new Date(sortedDates[0].date);
          };
          
          const aStartDate = getStartDate(a);
          const bStartDate = getStartDate(b);
          
          return aStartDate.getTime() - bStartDate.getTime();
        });

        setEvents(sortedEvents);
      } catch (error) {
        console.error("イベントの取得に失敗しました:", error);
        // エラー状態を表示するためのステート更新などを追加できます
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handlePurchase = async (eventId: string, eventName: string) => {
    // 購入処理（Stripe連携）
    try {
      if (!user) {
        // ログインしていない場合はログインページにリダイレクト
        alert("購入するにはログインが必要です");
        window.location.href = "/auth/login";
        return;
      }

      // 通常の購入処理（Stripe連携）続行
      // チェックアウトセッション作成をAPIに依頼
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          eventName,
          ticketPrice: 1800, // 固定価格（本来は動的に設定）
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "決済の準備に失敗しました");
      }
      
      const { url } = await response.json();
      
      // StripeのCheckoutページにリダイレクト
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("決済画面のURLが取得できませんでした");
      }
    } catch (error) {
      console.error("購入処理中にエラーが発生しました:", error);
      alert("購入処理に失敗しました。もう一度お試しください。");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  const formatEventDates = (dates: EventDate[]) => {
    if (!dates || dates.length === 0) return "日程未定";
    
    const formattedDates = dates.map(date => {
      const d = new Date(date.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    if (formattedDates.length === 1) return `2025/${formattedDates[0]}`;
    return `2025/${formattedDates[0]}-${formattedDates[formattedDates.length - 1]}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image
              className=""
              src="/logo.png"
              alt="Japan Coffee Festival Logo"
              width={260}
              height={65}
              priority
            />
            <UserAuthMenu />
          </div>
        </div>
      </header>

      {/* 決済ステータスメッセージ */}
      {paymentStatus && (
        <div className={`p-4 ${paymentStatus === 'success' ? 'bg-green-100' : 'bg-amber-100'} text-center`}>
          {paymentStatus === 'success' ? (
            <p className="text-green-800 font-medium">
              決済が完了しました！「チケット発行へ」からチケットを発行できます。
            </p>
          ) : (
            <p className="text-amber-800 font-medium">
              決済がキャンセルされました。
            </p>
          )}
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white overflow-hidden shadow-lg rounded-lg"
              >
                <div className="p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {event.event_number ? `第${event.event_number}回 ` : ''}{event.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-3">
                      テーマ「{event.theme}」
                    </p>
                    <div className="relative w-full h-64 mb-4">
                      <Image
                        src={event.image_url || "/hino.jpg"}
                        alt={event.name}
                        fill
                        className="object-contain rounded-sm bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      開催日: {formatEventDates(event.EventDate)}
                    </p>
                    {event.status === 'closed' ? (
                      <p className="text-sm font-medium text-red-600">
                        開催終了
                      </p>
                    ) : event.status === 'draft' ? (
                      <p className="text-sm font-medium text-gray-500">
                        準備中
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        当日券（¥1,800）
                      </p>
                    )}
                    {event.event_url && (
                      <p className="text-sm text-blue-600">
                        <a href={event.event_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          イベント詳細を見る
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="mt-6 space-y-3">
                    {event.status === 'published' && (
                      !purchasedEvents.has(event.id) ? (
                        <button
                          onClick={() => handlePurchase(event.id, event.name)}
                          className="w-full text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors font-noto-serif font-medium"
                          style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
                        >
                          購入する
                        </button>
                      ) : (
                        <>
                          <button
                            disabled
                            className="w-full text-muted-foreground px-4 py-2 rounded-md cursor-not-allowed font-noto-serif font-medium"
                            style={{ background: 'linear-gradient(135deg, hsl(210, 40%, 96.1%), hsl(210, 40%, 94.1%))' }}
                          >
                            購入済み
                          </button>
                          <Link href={`/ticket?event=${event.id}`}>
                            <button
                              className="w-full text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors font-noto-serif font-medium"
                              style={{ background: 'linear-gradient(135deg, hsl(173, 58%, 39%), hsl(173, 65%, 42%))' }}
                            >
                              チケット発行へ
                            </button>
                          </Link>
                        </>
                      )
                    )}
                    {event.status === 'draft' && (
                      <button
                        disabled
                        className="w-full text-muted-foreground px-4 py-2 rounded-md cursor-not-allowed font-noto-serif font-medium"
                        style={{ background: 'linear-gradient(135deg, hsl(210, 40%, 96.1%), hsl(210, 40%, 94.1%))' }}
                      >
                        準備中
                      </button>
                    )}
                    {event.status === 'closed' && (
                      <button
                        disabled
                        className="w-full text-muted-foreground px-4 py-2 rounded-md cursor-not-allowed font-noto-serif font-medium"
                        style={{ background: 'linear-gradient(135deg, hsl(210, 40%, 96.1%), hsl(210, 40%, 94.1%))' }}
                      >
                        終了しました
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
