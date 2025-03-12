"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Database } from "@/types/database.types";
import { supabaseBrowser } from "@/lib/supabase/client";

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
          .order('event_number', { ascending: false });

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

        setEvents(formattedEvents);
      } catch (error) {
        console.error("イベントの取得に失敗しました:", error);
        // エラー状態を表示するためのステート更新などを追加できます
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handlePurchase = (id: string) => {
    setPurchasedEvents(prev => new Set([...prev, id]));
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
          <Image
            className="mx-auto"
            src="/logo.png"
            alt="Japan Coffee Festival Logo"
            width={260}
            height={65}
            priority
          />
        </div>
      </header>

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
                          onClick={() => handlePurchase(event.id)}
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
                          <a href={`/ticket?event=${event.id}`}>
                            <button
                              className="w-full text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors font-noto-serif font-medium"
                              style={{ background: 'linear-gradient(135deg, hsl(173, 58%, 39%), hsl(173, 65%, 42%))' }}
                            >
                              チケット発行へ
                            </button>
                          </a>
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
