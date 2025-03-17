"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";
import { toast } from "@/components/ui/use-toast";

// データ型定義
type Event = Database["public"]["Tables"]["Event"]["Row"];
type EventDate = Database["public"]["Tables"]["EventDate"]["Row"];
type Shop = Database["public"]["Tables"]["Shop"]["Row"] & {
  attendance_id?: string;
};
type ShopAttendance = Database["public"]["Tables"]["ShopAttendance"]["Row"];

// 出店者情報の型定義を修正
type ShopAttendanceWithShop = {
  id: string;
  shop_id: string;
  Shop: {
    id: string;
    shop_code?: string;
    shop_name?: string;
    description: string | null;
    image_url: string | null;
    destiny_ratio?: number;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  };
};

// 日本語の曜日表記を取得する関数
const getJapaneseDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0: 日曜日, 1: 月曜日, ...
  const dayOfWeekJapanese = ['日', '月', '火', '水', '木', '金', '土'];
  return `（${dayOfWeekJapanese[dayOfWeek]}）`;
};

export default function FatePreparationPage() {
  // Supabaseクライアント
  const supabase = createClientComponentClient<Database>();

  // 状態管理
  const [events, setEvents] = useState<Event[]>([]);
  const [eventDates, setEventDates] = useState<EventDate[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedDateId, setSelectedDateId] = useState<string>("");
  const [selectedDateString, setSelectedDateString] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [isLoadingDates, setIsLoadingDates] = useState<boolean>(false);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // イベント一覧を取得
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const { data, error } = await supabase
          .from("Event")
          .select("*")
          .is("deleted_at", null)
          .order("event_number", { ascending: true });

        if (error) {
          throw error;
        }

        setEvents(data || []);
      } catch (error) {
        console.error("イベント取得エラー:", error);
        toast({
          title: "エラー",
          description: "イベント一覧の取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [supabase]);

  // イベント選択時の処理
  const handleEventChange = async (value: string) => {
    setSelectedEventId(value);
    setSelectedDateId("");
    setShops([]);
    setIsLoadingDates(true);

    try {
      const { data, error } = await supabase
        .from("EventDate")
        .select("*")
        .eq("event_id", value)
        .is("deleted_at", null)
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      setEventDates(data || []);
    } catch (error) {
      console.error("イベント日付取得エラー:", error);
      toast({
        title: "エラー",
        description: "イベント日付の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDates(false);
    }
  };

  // 日付選択時の処理
  const handleDateChange = async (value: string) => {
    setSelectedDateId(value);
    
    // 選択された日付の文字列を設定
    const selectedDate = eventDates.find(date => date.id === value);
    if (selectedDate) {
      setSelectedDateString(selectedDate.date);
    }
    
    setIsLoadingShops(true);

    try {
      // 1. まず出店情報を取得
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("ShopAttendance")
        .select("id, shop_id")
        .eq("event_date_id", value)
        .is("deleted_at", null);

      if (attendanceError) {
        throw attendanceError;
      }

      if (!attendanceData || attendanceData.length === 0) {
        setShops([]);
        return;
      }

      // 2. 取得した店舗IDのリストを作成
      const shopIds = attendanceData.map(attendance => attendance.shop_id);

      // 3. 店舗情報を別クエリで取得
      const { data: shopsData, error: shopsError } = await supabase
        .from("Shop")
        .select("*")
        .in("id", shopIds)
        .is("deleted_at", null);

      if (shopsError) {
        throw shopsError;
      }

      // 4. 出店者データと店舗データを結合
      const formattedShops: Shop[] = shopsData.map(shop => {
        const attendance = attendanceData.find(a => a.shop_id === shop.id);
        
        // 店舗コードから下4桁を抽出し、数値に変換
        const shopCodeLast4 = shop.shop_code ? 
          shop.shop_code.slice(-4) : '';
        const shopNumber = shopCodeLast4 ? parseInt(shopCodeLast4, 10) : 0;
        
        return {
          ...shop,
          name: shop.shop_name || shop.name || "名称未設定",
          attendance_id: attendance ? attendance.id : undefined,
          // 表示用の店舗番号を追加
          shopNumber: shopNumber
        };
      });

      // 店舗番号で昇順ソート
      formattedShops.sort((a, b) => {
        const numA = a.shopNumber || 0;
        const numB = b.shopNumber || 0;
        return numA - numB;
      });

      setShops(formattedShops);
    } catch (error) {
      console.error("出店者情報取得エラー:", error);
      toast({
        title: "エラー",
        description: "出店者情報の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShops(false);
    }
  };

  // 運命の比重変更時の処理
  const handleDestinyRatioChange = async (shopId: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    // 0〜10の範囲に制限
    const limitedValue = Math.min(Math.max(numValue, 0), 10);
    
    // UIを先に更新
    setShops(shops.map(shop => 
      shop.id === shopId ? { ...shop, destiny_ratio: limitedValue } : shop
    ));

    // Supabaseに更新
    try {
      console.log(`Shop ID: ${shopId} の destiny_ratio を ${limitedValue} に更新します`);
      
      const { error } = await supabase
        .from("Shop")
        .update({ destiny_ratio: limitedValue })
        .eq("id", shopId);

      if (error) {
        console.error("Supabase更新エラー:", error);
        throw error;
      }
      
      console.log(`Shop ID: ${shopId} の destiny_ratio を正常に更新しました`);
    } catch (error) {
      console.error("運命の比重更新エラー:", error);
      
      // エラーの詳細情報を出力
      if (error instanceof Error) {
        console.error("エラーメッセージ:", error.message);
        console.error("スタックトレース:", error.stack);
      } else {
        console.error("不明なエラー:", JSON.stringify(error));
      }
      
      toast({
        title: "エラー",
        description: "運命の比重の更新に失敗しました",
        variant: "destructive",
      });
      
      // エラーの場合は元の値に戻す
      const originalShop = shops.find(shop => shop.id === shopId);
      if (originalShop) {
        setShops(shops.map(shop => 
          shop.id === shopId ? { ...shop, destiny_ratio: originalShop.destiny_ratio } : shop
        ));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">運命の準備</h1>
        <p className="mt-2 text-sm text-gray-700">
          イベント日ごとの運命のチケットを生成・管理します
        </p>
      </div>

      {/* イベント・日付選択 */}
      <Card>
        <CardHeader>
          <CardTitle>イベント・日付選択</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">イベント</label>
              {isLoadingEvents ? (
                <div className="flex items-center justify-center p-2">
                  <Spinner size="sm" />
                </div>
              ) : (
                <Select value={selectedEventId} onValueChange={handleEventChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="イベントを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">開催日</label>
              {isLoadingDates ? (
                <div className="flex items-center justify-center p-2">
                  <Spinner size="sm" />
                </div>
              ) : (
                <Select 
                  value={selectedDateId} 
                  onValueChange={handleDateChange}
                  disabled={!selectedEventId || eventDates.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="開催日を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventDates.map((date) => (
                      <SelectItem key={date.id} value={date.id}>
                        {date.date}{getJapaneseDayOfWeek(date.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 出店者一覧 */}
      {selectedDateId && (
        <Card>
          <CardHeader>
            <CardTitle>出店者一覧（{shops.length}店舗）</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingShops ? (
              <div className="flex items-center justify-center p-4">
                <Spinner />
              </div>
            ) : shops.length > 0 ? (
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="py-1">店舗番号</TableHead>
                    <TableHead className="py-1">店名</TableHead>
                    <TableHead className="py-1">運命の比重 (0-10)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shops.map((shop) => (
                    <TableRow key={shop.id} className="h-8 hover:bg-gray-50">
                      <TableCell className="py-1">
                        {shop.shop_code ? parseInt(shop.shop_code.slice(-4), 10) : ''}
                      </TableCell>
                      <TableCell className="py-1">{shop.shop_name}</TableCell>
                      <TableCell className="py-1 w-32">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={shop.destiny_ratio || 0}
                          onChange={(e) => handleDestinyRatioChange(shop.id, e.target.value)}
                          className="h-7 px-2"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-gray-500">
                この日付に登録されている出店者はいません
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 運命チケット管理 - 実装しない */}
      {selectedDateId && shops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>運命チケット管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="default" 
                  disabled={isLoading}
                >
                  {isLoading ? <><Spinner size="sm" className="mr-2" /> 処理中...</> : "運命チケット作成"}
                </Button>
                <p className="text-sm text-gray-500 mt-2 sm:mt-0 sm:ml-2">
                  ※ この機能は現在実装中です
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 