"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { EventWithDates, Database } from "@/types/database.types";

// データベースのステータスカラムを参照する
type EventStatus = "draft" | "published" | "closed";
// EventWithDatesにすでにstatusカラムが含まれるようになったので、EventWithStatusは不要になりました

const STATUS_MAP = {
  draft: { label: "下書き", className: "bg-gray-100 text-gray-800" },
  published: { label: "公開中", className: "bg-green-100 text-green-800" },
  closed: { label: "終了", className: "bg-red-100 text-red-800" },
} as const;

export function EventsClient({ initialEvents }: { initialEvents: EventWithDates[] }) {
  // イベントデータを使用
  const [events, setEvents] = useState<EventWithDates[]>(initialEvents);
  const supabase = createClientComponentClient<Database>();

  // コンポーネントマウント時にデータベース情報を取得
  useEffect(() => {
    const checkDatabaseSchema = async () => {
      try {
        // Eventテーブルの情報を取得
        const { data, error } = await supabase
          .from("Event")
          .select("*")
          .limit(1);
          
        if (error) {
          console.error("Error fetching Event table:", error);
        } else {
          console.log("Event table sample data:", data);
          
          // get_tables RPCの呼び出しを削除
        }
      } catch (error) {
        console.error("Database check error:", error);
      }
    };
    
    checkDatabaseSchema();
  }, [supabase]);

  // 日付フォーマット用関数
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // イベントの開始日と終了日を取得する関数
  const getEventDates = (event: EventWithDates) => {
    // EventDateが配列として存在するか確認
    if (!event.EventDate || !Array.isArray(event.EventDate) || event.EventDate.length === 0) {
      return { startDate: "日付不明", endDate: "日付不明" };
    }
    
    // 日付を日付順にソート
    const sortedDates = [...event.EventDate].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    return {
      startDate: sortedDates[0].date,
      endDate: sortedDates[sortedDates.length - 1].date
    };
  };

  // イベントを開催日初日の昇順でソートする
  useEffect(() => {
    const sortEventsByStartDate = () => {
      const sortedEvents = [...events].sort((a, b) => {
        const aDates = getEventDates(a);
        const bDates = getEventDates(b);
        
        // 日付不明の場合は最後に表示
        if (aDates.startDate === "日付不明" && bDates.startDate === "日付不明") return 0;
        if (aDates.startDate === "日付不明") return 1;
        if (bDates.startDate === "日付不明") return -1;
        
        return new Date(aDates.startDate).getTime() - new Date(bDates.startDate).getTime();
      });
      
      setEvents(sortedEvents);
    };
    
    sortEventsByStartDate();
  }, [initialEvents, events]); // initialEventsとeventsが変更されたときに実行

  // ステータス変更処理
  const handleStatusChange = async (eventId: string, newStatus: EventStatus) => {
    try {
      console.log(`Updating event ${eventId} status to ${newStatus}`);
      
      // まず現在のイベントデータを取得して確認
      const { data: currentEvent, error: fetchError } = await supabase
        .from("Event")
        .select("*")
        .eq("id", eventId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching current event:", fetchError);
        throw new Error(`イベントの取得に失敗しました: ${fetchError.message}`);
      }
      
      console.log("Current event data:", currentEvent);
      
      // 更新するデータを準備
      const updateData = {
        status: newStatus
        // updated_atフィールドは削除（テーブルにこのフィールドが存在しないため）
      };
      
      console.log("Updating with data:", updateData);
      
      // 別の方法でステータス更新を試みる
      try {
        // 方法1: 直接SQLを実行する方法は削除（エラーの原因になる可能性があるため）
      } catch {
        console.log("RPC method not available, trying direct update");
      }
      
      // 方法2: 通常のupdate
      const { data, error } = await supabase
        .from("Event")
        .update(updateData)
        .eq("id", eventId)
        .select();
      
      if (error) {
        console.error("Status update error details:", error);
        
        // エラーの詳細情報を取得
        if (error.code) {
          console.error(`Error code: ${error.code}, Message: ${error.message}, Details: ${error.details}`);
        }
        
        throw new Error(`ステータス更新エラー: ${error.message || JSON.stringify(error)}`);
      }

      console.log("Update successful:", data);

      // 更新に成功したら、ローカルの状態も更新し、再ソートする
      if (data) {
        const updatedEvents = events.map(event => 
          event.id === eventId ? { ...event, status: newStatus } : event
        );
        
        // 更新後のイベントリストを開催日初日の昇順でソート
        const sortedEvents = [...updatedEvents].sort((a, b) => {
          const aDates = getEventDates(a);
          const bDates = getEventDates(b);
          
          // 日付不明の場合は最後に表示
          if (aDates.startDate === "日付不明" && bDates.startDate === "日付不明") return 0;
          if (aDates.startDate === "日付不明") return 1;
          if (bDates.startDate === "日付不明") return -1;
          
          return new Date(aDates.startDate).getTime() - new Date(bDates.startDate).getTime();
        });
        
        setEvents(sortedEvents);
        alert(`ステータスを「${STATUS_MAP[newStatus].label}」に変更しました`);
      }

    } catch (error) {
      console.error("Status update error:", error);
      
      // エラーの詳細情報を表示
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      alert(`ステータスの更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  return (
    <div>
      <div className="mb-8 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">イベント管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            イベントの一覧表示、登録、編集を行うことができます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/events/new"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            新規イベント登録
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      イベント名
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      開催期間
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      ステータス
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {events.map((event) => {
                    // イベントの開始日と終了日を取得
                    const { startDate, endDate } = getEventDates(event);
                    
                    return (
                      <tr key={event.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-14 w-14 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                #{event.event_number || '新規'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">
                                {event.name}
                              </div>
                              <div className="text-gray-500">
                                {event.description || "説明なし"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {startDate !== "日付不明" ? formatDate(startDate) : startDate} 〜 {endDate !== "日付不明" ? formatDate(endDate) : endDate}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <select
                            value={event.status || "published"}
                            onChange={(e) => handleStatusChange(event.id, e.target.value as EventStatus)}
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_MAP[(event.status || "published") as EventStatus].className}`}
                          >
                            {Object.entries(STATUS_MAP).map(([value, { label }]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/admin/events/${event.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            編集
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}