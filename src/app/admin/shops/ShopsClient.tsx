"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

type Shop = {
  id: string;
  shop_code: string;
  shop_name: string;
  coffee_name: string;
  greeting: string;
  roast_level: string;
  pr_url: string;
  destiny_ratio: number;
  ticket_count: number;
  image_url: string | null;
  notes: string;
  event_id?: string;
};

type ShopAttendance = {
  id: string;
  shop_id: string;
  event_date_id: string;
  deleted_at: string | null;
};

type EventDate = {
  id: string;
  date: string;
  time: string;
  event_id: string;
};

type Event = {
  id: string;
  name: string;
  event_number?: number;
  EventDate?: EventDate[];
};

export function ShopsClient({ initialShops, events }: { initialShops: Shop[], events: Event[] }) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [filteredShops, setFilteredShops] = useState<Shop[]>(initialShops);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [attendances, setAttendances] = useState<ShopAttendance[]>([]);
  const [loadingAttendances, setLoadingAttendances] = useState<{[key: string]: boolean}>({});
  const [eventDates, setEventDates] = useState<EventDate[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [selectedAttendances, setSelectedAttendances] = useState<{shopId: string, eventDateId: string, isAttending: boolean}[]>([]);
  const supabase = createClientComponentClient();

  // イベント選択時の処理
  useEffect(() => {
    if (!selectedEventId) {
      setFilteredShops(shops);
      setEventDates([]);
      setAttendances([]);
      return;
    }

    // 選択したイベントのイベント番号を取得
    const selectedEvent = events.find(event => event.id === selectedEventId);
    if (!selectedEvent) {
      setFilteredShops(shops);
      setEventDates([]);
      setAttendances([]);
      return;
    }

    // 選択したイベントの出店者のみをフィルタリング
    // event_idで紐付く店舗をフィルタリング
    const filtered = shops.filter(shop => {
      if (selectedEventId === "all") {
        return true; // 「すべてのイベント」が選択された場合は全ての店舗を表示
      }
      return shop.event_id === selectedEventId;
    });
    
    // 店舗番号で数値的にソートする
    const sortedFiltered = [...filtered].sort((a, b) => {
      const shopNumberA = a.shop_code.split('-')[1]?.substring(1) || '0';
      const shopNumberB = b.shop_code.split('-')[1]?.substring(1) || '0';
      // ゼロパディングを無視して数値としてソート
      return parseInt(shopNumberA, 10) - parseInt(shopNumberB, 10);
    });

    setFilteredShops(sortedFiltered);
    
    // イベントの日程と出店情報を取得
    if (selectedEventId && selectedEventId !== "all") {
      fetchAttendanceData(selectedEventId);
    }
  }, [selectedEventId, shops, events]);
  
  // 出店日情報を取得する関数
  const fetchAttendanceData = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/shops/attendance?event_id=${eventId}`);
      if (!response.ok) {
        throw new Error('出店日情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setEventDates(data.eventDates || []);
      setAttendances(data.attendances || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: 'エラー',
        description: '出店日情報の取得に失敗しました',
        variant: 'destructive'
      });
    }
  };
  
  // 出店日の切り替え処理（API呼び出しは行わず、選択状態のみを管理）
  const toggleAttendance = (shopId: string, eventDateId: string, isCurrentlyAttending: boolean) => {
    // 選択状態を反転させる
    const newAttendingValue = !isCurrentlyAttending;
    
    setSelectedAttendances(prev => {
      // 現在の選択状態を取得
      const existingItem = prev.find(item => 
        item.shopId === shopId && item.eventDateId === eventDateId
      );

      // 既存の選択項目を全てフィルタリングで除去
      const filteredItems = prev.filter(item => 
        !(item.shopId === shopId && item.eventDateId === eventDateId)
      );
      
      // 新しい選択状態を追加
      return [...filteredItems, { shopId, eventDateId, isAttending: newAttendingValue }];
    });
  };

  // 出店日情報をAPI経由で更新する処理
  const updateAttendance = async (shopId: string, eventDateId: string, isAttending: boolean) => {
    // ローディング状態を設定
    const loadingKey = `${shopId}-${eventDateId}`;
    setLoadingAttendances(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const response = await fetch('/api/admin/shops/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId,
          eventDateId,
          isAttending
        })
      });
      
      if (!response.ok) {
        throw new Error('出店日情報の更新に失敗しました');
      }
      
      const data = await response.json();
      
      // 成功した場合、状態を更新
      if (data.success) {
        if (isAttending) {
          // 出席に変更された場合、attendancesに追加
          const newAttendance = data.attendance;
          setAttendances(prev => [...prev.filter(a => a.id !== newAttendance.id), newAttendance]);
        } else {
          // 欠席に変更された場合、attendancesから削除するか、deleted_atを設定
          setAttendances(prev => {
            // データが返ってきた場合は更新、そうでない場合は削除
            if (data.attendance) {
              return prev.map(a => a.shop_id === shopId && a.event_date_id === eventDateId ? { ...a, deleted_at: data.attendance.deleted_at } : a);
            } else {
              return prev.filter(a => !(a.shop_id === shopId && a.event_date_id === eventDateId));
            }
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'エラー',
        description: '出店日情報の更新に失敗しました',
        variant: 'destructive'
      });
      return false;
    } finally {
      // ローディング状態を解除
      setLoadingAttendances(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // 一括更新処理
  const handleBatchUpdate = async () => {
    if (selectedAttendances.length === 0) {
      toast({
        title: '注意',
        description: '更新する出店日が選択されていません',
        variant: 'default'
      });
      return;
    }

    setIsBatchProcessing(true);
    
    let successCount = 0;
    let failureCount = 0;

    // 選択された出店日を1つずつ処理
    for (const attendance of selectedAttendances) {
      const success = await updateAttendance(
        attendance.shopId,
        attendance.eventDateId,
        attendance.isAttending
      );

      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // 処理完了後、選択をクリア
    setSelectedAttendances([]);
    setIsBatchProcessing(false);

    // 結果を通知
    toast({
      title: '更新完了',
      description: `${successCount}件の更新に成功し、${failureCount}件の更新に失敗しました`,
      variant: failureCount > 0 ? 'destructive' : 'default'
    });
  };
  
  // 出店日を一括で設定/解除する処理
  const handleBulkAttendanceUpdate = async (shopId: string, isAttending: boolean) => {
    if (!eventDates.length) return;
    
    setIsBulkUpdating(true);
    
    try {
      // 各イベント日に対して処理を実行
      for (const eventDate of eventDates) {
        // 現在の状態を確認
        const currentAttendance = attendances.find(
          a => a.shop_id === shopId && a.event_date_id === eventDate.id && a.deleted_at === null
        );
        const isCurrentlyAttending = !!currentAttendance;
        
        // 現在の状態と希望する状態が異なる場合のみ更新
        if (isCurrentlyAttending !== isAttending) {
          await fetch('/api/admin/shops/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              shopId,
              eventDateId: eventDate.id,
              isAttending
            })
          });
        }
      }
      
      // 更新後、最新の出店日情報を取得
      if (selectedEventId && selectedEventId !== "all") {
        await fetchAttendanceData(selectedEventId);
      }
      
      toast({
        title: '成功',
        description: isAttending ? '全ての出店日を設定しました' : '全ての出店日を解除しました',
      });
    } catch (error) {
      console.error('Error bulk updating attendance:', error);
      toast({
        title: 'エラー',
        description: '出店日情報の一括更新に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/shops/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("インポートに失敗しました");
      }

      // データを再取得
      const { data } = await supabase
        .from("Shop")
        .select("*")
        .order("shop_code");
      
      if (data) {
        setShops(data);
        
        // フィルタリング適用
        if (selectedEventId) {
          const selectedEvent = events.find(event => event.id === selectedEventId);
          if (selectedEvent) {
            const filtered = data.filter(shop => {
              const shopEventNumber = shop.shop_code.split('-')[0];
              return shopEventNumber === selectedEvent.event_number;
            });
            setFilteredShops(filtered);
          }
        } else {
          setFilteredShops(data);
        }
      }

      alert("CSVのインポートが完了しました");
    } catch (error) {
      console.error("Import error:", error);
      alert("CSVのインポートに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">出店者管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            出店者の一覧表示、登録、編集を行うことができます
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className={`inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isUploading ? "アップロード中..." : "CSVインポート"}
            </label>
          </div>
          <Link
            href="/admin/shops/new"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            新規出店者登録
          </Link>
        </div>
      </div>
      
      {/* イベント選択セレクトボックス */}
      <div className="mb-6">
        <div className="w-full max-w-md"> {/* max-w-xs から max-w-md へ変更（約30%幅増加） */}
          <Label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-1">
            イベントで絞り込む
          </Label>
          <Select
            value={selectedEventId}
            onValueChange={setSelectedEventId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="すべてのイベント" />
            </SelectTrigger>
            <SelectContent className="bg-white"> {/* 背景色を白に設定 */}
              <SelectItem value="all" className="bg-white hover:bg-gray-100">すべてのイベント</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id} className="bg-white hover:bg-gray-100">
                  {event.name || `第${event.event_number}回`} {event.EventDate && event.EventDate.length > 0 ? `(${new Date(event.EventDate[0].date).toLocaleDateString()})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedEventId && selectedEventId !== "" && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleBatchUpdate}
            disabled={isBatchProcessing || selectedAttendances.length === 0}
            className={`inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${(isBatchProcessing || selectedAttendances.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isBatchProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                処理中...
              </>
            ) : (
              <>出店日一括更新 ({selectedAttendances.length}件)</>  
            )}
          </button>
        </div>
      )}

      {selectedEventId && selectedEventId !== "" ? (
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
                      番号
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      出店者名
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      チケット枚数
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      運命の比重
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      出店日
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredShops.map((shop) => {
                    // 店舗コードから番号を抽出
                    const shopCodeParts = shop.shop_code.split('-');
                    const shopTypeAndNumber = shopCodeParts[1] || '';
                    const shopNumber = shopTypeAndNumber.substring(1); // 最初の文字（タイプ）を除いた部分
                    // ゼロパディングを除去して表示（例: 01 → 1）
                    const displayShopNumber = shopNumber === '0' ? '' : parseInt(shopNumber, 10).toString();
                    
                    // 選択されたイベントの日付を取得
                    const selectedEvent = events.find(event => event.id === selectedEventId);
                    const eventDates = selectedEvent?.EventDate || [];
                    
                    return (
                      <tr key={shop.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {displayShopNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {shop.image_url && (
                              <div className="h-10 w-10 flex-shrink-0">
                                <Image
                                  className="h-10 w-10 rounded-full"
                                  src={shop.image_url}
                                  alt=""
                                  width={40}
                                  height={40}
                                />
                              </div>
                            )}
                            <div className="ml-4">
                              <Link
                                href={`/admin/shops/${shop.id}/edit`}
                                className="font-medium text-indigo-600 hover:text-indigo-900"
                              >
                                {shop.shop_name}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {shop.ticket_count}枚
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {shop.destiny_ratio !== undefined && shop.destiny_ratio !== null ? shop.destiny_ratio : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {eventDates.length > 0 && (
                            <div className="flex flex-col gap-2">

                              <div className="flex flex-row flex-wrap gap-3">
                                {eventDates.map((eventDate) => {
                                  // 該当の店舗と日付の出店情報を確認
                                  const isAttending = attendances.some(
                                    (a) => a.shop_id === shop.id && a.event_date_id === eventDate.id && a.deleted_at === null
                                  );
                                  const loadingKey = `${shop.id}-${eventDate.id}`;
                                  const isLoading = loadingAttendances[loadingKey];
                                  
                                  // 日付を月/日のフォーマットに変換
                                  const date = new Date(eventDate.date);
                                  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
                                  
                                  return (
                                    <div key={eventDate.id} className="flex items-center gap-1 select-none cursor-default">
                                      <Checkbox
                                        id={`attendance-${shop.id}-${eventDate.id}`}
                                        disabled={isLoading || isBatchProcessing}
                                        checked={
                                          // 選択状態を正確に計算
                                          (() => {
                                            const selectedAttendance = selectedAttendances.find(
                                              a => a.shopId === shop.id && a.eventDateId === eventDate.id
                                            );
                                            // 選択状態があればそれを優先
                                            if (selectedAttendance !== undefined) {
                                              return selectedAttendance.isAttending;
                                            }
                                            // なければ現在の状態を使用
                                            return isAttending;
                                          })()
                                        }
                                        onCheckedChange={() => toggleAttendance(shop.id, eventDate.id, isAttending)}
                                        className="h-3.5 w-3.5"
                                      />
                                      <label 
                                        htmlFor={`attendance-${shop.id}-${eventDate.id}`} 
                                        className="text-xs text-gray-700 flex items-center whitespace-nowrap"
                                      >
                                        {formattedDate}
                                        {isLoading && (
                                          <svg className="animate-spin ml-1 h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                        )}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
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
      ) : (
        <div className="mt-8 p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">イベントを選択すると出店者一覧が表示されます</p>
        </div>
      )}
    </div>
  );
}