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
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Trash2, Plus } from "lucide-react";

// データ型定義
type Event = Database["public"]["Tables"]["Event"]["Row"];
type EventDate = Database["public"]["Tables"]["EventDate"]["Row"];
type Shop = Database["public"]["Tables"]["Shop"]["Row"] & {
  destiny_ratio?: number;
};
type FateTicket = Database["public"]["Tables"]["FateTicket"]["Row"] & {
  Shop: {
    shop_name?: string;
    shop_code?: string;
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
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  
  // 状態管理
  const [events, setEvents] = useState<Event[]>([]);
  const [eventDates, setEventDates] = useState<EventDate[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedDateString, setSelectedDateString] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);
  const [isLoadingDates, setIsLoadingDates] = useState<boolean>(false);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isCreatingTickets, setIsCreatingTickets] = useState(false);
  const [fateTickets, setFateTickets] = useState<FateTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isDeletingTickets, setIsDeletingTickets] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const ITEMS_PER_PAGE = 50;

  // イベント一覧を取得
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const { data, error } = await supabase
          .from("Event")
          .select("*")
          .is("deleted_at", null)
          .order("event_number", { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("イベント取得エラー:", error);
        toast({
          title: "エラー",
          description: "イベント情報の取得に失敗しました",
          variant: "destructive",
        });
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [supabase, toast]);

  // イベント選択時の処理
  const handleEventChange = (value: string) => {
    setSelectedEventId(value);
    setSelectedDateId(null);
    setShops([]);
    setFateTickets([]);
    fetchEventDates(value);
  };

  // イベント日付の取得
  const fetchEventDates = async (eventId: string) => {
    try {
      setIsLoadingDates(true);
      const { data, error } = await supabase
        .from("EventDate")
        .select("*")
        .eq("event_id", eventId)
        .is("deleted_at", null)
        .order("date");

      if (error) throw error;
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
    setShops([]);
    setFateTickets([]);
    
    // 選択された日付の文字列を保存
    const selectedDate = eventDates.find(date => date.id === value);
    if (selectedDate) {
      setSelectedDateString(selectedDate.date);
    }
    
    try {
      setIsLoadingShops(true);
      
      // 選択された日付に参加する店舗情報を取得
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("ShopAttendance")
        .select("id, shop_id")
        .eq("event_date_id", value)
        .is("deleted_at", null);

      if (attendanceError) throw attendanceError;
      
      if (!attendanceData || attendanceData.length === 0) {
        setShops([]);
        setIsLoadingShops(false);
        return;
      }
      
      // 取得した店舗IDのリストを作成
      const shopIds = attendanceData.map(attendance => attendance.shop_id);
      
      // 店舗情報を別クエリで取得
      const { data: shopsData, error: shopsError } = await supabase
        .from("Shop")
        .select("*")
        .in("id", shopIds)
        .is("deleted_at", null);
      
      if (shopsError) throw shopsError;
      
      // 店舗データを整形
      const formattedShops: Shop[] = shopsData.map(shop => ({
        ...shop,
        destiny_ratio: shop.destiny_ratio || 0
      }));
      
      // 店舗番号で昇順ソート
      formattedShops.sort((a, b) => {
        const numA = a.shop_code ? parseInt(a.shop_code.slice(-4), 10) || 0 : 0;
        const numB = b.shop_code ? parseInt(b.shop_code.slice(-4), 10) || 0 : 0;
        return numA - numB;
      });
      
      setShops(formattedShops);
      
      // 運命チケットを取得（ページを1に戻す）
      await fetchFateTickets(selectedEventId as string, value, 1);
      
    } catch (error) {
      console.error("店舗取得エラー:", error);
      toast({
        title: "エラー",
        description: "店舗情報の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShops(false);
    }
  };

  // 運命チケットを取得する関数
  const fetchFateTickets = async (eventId: string, dateId: string, page: number = 1) => {
    try {
      setIsLoadingTickets(true);
      
      // APIエンドポイントを使用してチケットを取得
      const response = await fetch("/api/admin/fate-tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          event_date_id: dateId,
          page,
          pageSize: ITEMS_PER_PAGE
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "チケットの取得に失敗しました");
      }
      
      const result = await response.json();
      
      // 取得したデータを状態に設定
      setFateTickets(result.data.tickets || []);
      setTotalTickets(result.data.totalCount || 0);
      setTotalPages(result.data.totalPages || 1);
      setCurrentPage(page);
      
      console.log("チケット取得成功:", {
        件数: result.data.tickets?.length || 0,
        総数: result.data.totalCount || 0,
        ページ: page,
        総ページ数: result.data.totalPages || 1
      });
      
    } catch (error) {
      console.error("チケット取得エラー:", error);
      toast({
        title: "エラー",
        description: "運命チケットの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // チケットの選択状態を切り替える関数
  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  // 選択したチケットを削除する関数
  const handleDeleteSelectedTickets = async () => {
    if (selectedTickets.length === 0) return;
    
    try {
      setIsDeletingTickets(true);
      
      // APIエンドポイントを使用してチケットを削除
      const response = await fetch("/api/admin/fate-tickets/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_ids: selectedTickets
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "チケットの削除に失敗しました");
      }
      
      const result = await response.json();
      console.log("削除結果:", result);
      
      // 成功メッセージ
      toast({
        title: "成功",
        description: `${selectedTickets.length}件のチケットを削除しました`,
      });
      
      // チケット一覧を再取得（現在のページを維持）
      if (selectedEventId && selectedDateId) {
        await fetchFateTickets(selectedEventId, selectedDateId, currentPage);
      }
      
      // 選択をクリア
      setSelectedTickets([]);
    } catch (error) {
      console.error("チケット削除エラー:", error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "チケットの削除に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTickets(false);
    }
  };

  // 運命チケット作成処理
  const handleCreateFateTickets = async () => {
    if (!selectedEventId || !selectedDateId || shops.length === 0) {
      toast({
        title: "エラー",
        description: "イベント、開催日、出店者情報が必要です",
        variant: "destructive",
      });
      return;
    }

    try {
      // ローディング状態を設定
      setIsCreatingTickets(true);
      setIsLoading(true); // 全体のローディング状態も設定
      console.log("運命チケット作成開始");
      console.log(`選択された日付: ${selectedDateString}`); // selectedDateStringを使用

      // APIリクエストデータの準備
      const requestData = {
        event_id: selectedEventId,
        event_date_id: selectedDateId,
        shops: shops.map(shop => ({
          id: shop.id,
          destiny_ratio: shop.destiny_ratio || 0
        }))
      };
      console.log("APIリクエストデータ:", JSON.stringify(requestData, null, 2));

      // APIリクエスト
      console.log("APIリクエスト送信中...");
      const response = await fetch("/api/admin/fate-batch/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });
      console.log("APIレスポンスステータス:", response.status, response.statusText);

      const result = await response.json();
      console.log("APIレスポンス内容:", JSON.stringify(result, null, 2));

      if (!response.ok) {
        throw new Error(result.error || "運命チケットの作成に失敗しました");
      }

      // 成功メッセージ
      toast({
        title: "成功",
        description: result.message || "運命チケットの作成が完了しました",
      });
      console.log("運命チケット作成結果:", result);
      
      // チケット一覧を再取得（ページを1に戻す）
      if (selectedEventId && selectedDateId) {
        await fetchFateTickets(selectedEventId, selectedDateId, 1);
      }
    } catch (error) {
      console.error("運命チケット作成エラー:", error);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "運命チケットの作成中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTickets(false);
      setIsLoading(false); // ローディング状態を解除
      console.log("運命チケット作成処理完了");
    }
  };

  // 店舗の比重を更新する関数
  const updateShopRatio = (shopId: string, ratio: number) => {
    setShops(prevShops => 
      prevShops.map(shop => 
        shop.id === shopId 
          ? { ...shop, destiny_ratio: ratio } 
          : shop
      )
    );
  };

  // ページ変更ハンドラー
  const handlePageChange = (newPage: number) => {
    if (selectedEventId && selectedDateId) {
      fetchFateTickets(selectedEventId, selectedDateId, newPage);
    }
  };

  // 状態更新後にも確認ログを追加
  useEffect(() => {
    console.log("fateTickets状態更新:", {
      件数: fateTickets.length,
      データ例: fateTickets.length > 0 ? fateTickets[0] : "なし"
    });
  }, [fateTickets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">運命の準備</h1>
        <p className="mt-2 text-sm text-gray-700">
          イベント日ごとの運命のチケットを生成・管理します
        </p>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Spinner size="lg" className="mb-4" />
            <p className="text-gray-800 font-medium">処理中...</p>
          </div>
        </div>
      )}

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
                <Select value={selectedEventId || ""} onValueChange={handleEventChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="イベントを選択" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {events.map((event) => {
                      console.log("イベント情報:", event.id, event.name, event.event_number); // デバッグ用ログ
                      return (
                        <SelectItem key={event.id} value={event.id} className="hover:bg-gray-100">
                          {event.event_number !== null && event.event_number !== undefined 
                            ? `第${event.event_number}回 ` 
                            : ''}{event.name}
                        </SelectItem>
                      );
                    })}
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
                  value={selectedDateId || ""} 
                  onValueChange={handleDateChange}
                  disabled={!selectedEventId || eventDates.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedEventId 
                        ? "先にイベントを選択してください" 
                        : eventDates.length === 0 
                          ? "開催日が登録されていません" 
                          : "開催日を選択"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {eventDates.map((date) => (
                      <SelectItem key={date.id} value={date.id} className="hover:bg-gray-100">
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
                          onChange={(e) => updateShopRatio(shop.id, parseInt(e.target.value) || 0)}
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

      {/* 運命チケット管理 */}
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
                  disabled={isCreatingTickets || !selectedEventId || !selectedDateId || shops.length === 0}
                  onClick={() => {
                    console.log("運命チケット作成ボタンがクリックされました");
                    handleCreateFateTickets();
                  }}
                  className="relative bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md shadow-md hover:shadow-lg transition-all duration-200"
                  size="lg"
                >
                  {isCreatingTickets ? (
                    <>
                      <span className="opacity-0">運命チケット作成</span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Spinner size="sm" className="mr-2" />
                        処理中...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      運命チケット作成
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2 sm:mt-0 sm:ml-2 flex items-center">
                  ※ 運命の比重に応じてチケットが生成されます
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 運命チケット一覧 */}
      {selectedDateId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>運命チケット一覧（全{totalTickets}件）</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelectedTickets}
                disabled={selectedTickets.length === 0 || isDeletingTickets}
                className="flex items-center"
              >
                {isDeletingTickets ? <Spinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                選択したチケットを削除 ({selectedTickets.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTickets ? (
              <div className="flex items-center justify-center p-4">
                <Spinner />
              </div>
            ) : fateTickets.length > 0 ? (
              <>
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="py-1 w-10">
                        <Checkbox
                          checked={selectedTickets.length > 0 && selectedTickets.length === fateTickets.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTickets(fateTickets.map(ticket => ticket.id));
                            } else {
                              setSelectedTickets([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="py-1">バッチID</TableHead>
                      <TableHead className="py-1">ポジション</TableHead>
                      <TableHead className="py-1">店名</TableHead>
                      <TableHead className="py-1">抽選者ID</TableHead>
                      <TableHead className="py-1">抽選日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fateTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="h-8 hover:bg-gray-50">
                        <TableCell className="py-1">
                          <Checkbox
                            checked={selectedTickets.includes(ticket.id)}
                            onCheckedChange={() => toggleTicketSelection(ticket.id)}
                          />
                        </TableCell>
                        <TableCell className="py-1">{ticket.batch_id}</TableCell>
                        <TableCell className="py-1">{ticket.fate_position}</TableCell>
                        <TableCell className="py-1">
                          {ticket.Shop?.shop_code && (
                            <span className="font-medium text-gray-500 mr-2">
                              {parseInt(ticket.Shop.shop_code.slice(-4), 10)}
                            </span>
                          )}
                          {ticket.Shop?.shop_name || '不明'}
                        </TableCell>
                        <TableCell className="py-1">{ticket.drawn_by_id || '-'}</TableCell>
                        <TableCell className="py-1">{ticket.drawn_at ? new Date(ticket.drawn_at).toLocaleDateString('ja-JP') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* ページネーション */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    {totalTickets}件中 {(currentPage - 1) * ITEMS_PER_PAGE + 1}～{Math.min(currentPage * ITEMS_PER_PAGE, totalTickets)}件を表示
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || isLoadingTickets}
                    >
                      最初
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoadingTickets}
                    >
                      前へ
                    </Button>
                    <span className="px-2 py-1">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoadingTickets}
                    >
                      次へ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || isLoadingTickets}
                    >
                      最後
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                運命チケットがありません。「運命チケット作成」ボタンからチケットを生成してください。
              </div>
            )}
            
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={handleCreateFateTickets}
                disabled={isCreatingTickets || !selectedEventId || !selectedDateId || shops.length === 0}
                className="flex items-center"
              >
                {isCreatingTickets ? <Spinner size="sm" className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                追加作成
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 