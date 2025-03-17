"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";

// 仮のデータ型定義
type Event = {
  id: string;
  name: string;
};

type EventDate = {
  id: string;
  date: string;
  event_id: string;
};

type Shop = {
  id: string;
  shop_number: string;
  shop_name: string;
  destiny_ratio: number;
};

type FateTicket = {
  id: string;
  batch_id: string;
  position: number;
  shop_name: string;
  drawn_by_id: string | null;
  drawn_at: string | null;
};

export default function FatePreparationPage() {
  // 状態管理
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedDateId, setSelectedDateId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [fateTickets, setFateTickets] = useState<FateTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [hasExistingTickets, setHasExistingTickets] = useState<boolean>(false);

  // 仮のデータ
  const events: Event[] = [
    { id: "1", name: "JCF 2023 Spring" },
    { id: "2", name: "JCF 2023 Summer" },
    { id: "3", name: "JCF 2023 Autumn" },
  ];

  const eventDates: EventDate[] = [
    { id: "1", date: "2023-04-01", event_id: "1" },
    { id: "2", date: "2023-04-02", event_id: "1" },
    { id: "3", date: "2023-07-15", event_id: "2" },
    { id: "4", date: "2023-07-16", event_id: "2" },
    { id: "5", date: "2023-10-21", event_id: "3" },
    { id: "6", date: "2023-10-22", event_id: "3" },
  ];

  // イベント選択時の処理
  const handleEventChange = (value: string) => {
    setSelectedEventId(value);
    setSelectedDateId("");
    setShops([]);
    setFateTickets([]);
    setHasExistingTickets(false);
  };

  // 日付選択時の処理
  const handleDateChange = (value: string) => {
    setSelectedDateId(value);
    // 実際の実装では、ここでAPIを呼び出して出店者情報を取得する
    // 仮のデータを設定
    setShops([
      { id: "1", shop_number: "001", shop_name: "Coffee Shop A", destiny_ratio: 5 },
      { id: "2", shop_number: "002", shop_name: "Coffee Shop B", destiny_ratio: 3 },
      { id: "3", shop_number: "003", shop_name: "Coffee Shop C", destiny_ratio: 7 },
      { id: "4", shop_number: "004", shop_name: "Coffee Shop D", destiny_ratio: 2 },
    ]);

    // 仮に運命チケットが存在するかどうかをチェック
    // 実際の実装では、APIを呼び出して確認する
    const hasTickets = Math.random() > 0.5; // ランダムに存在するかどうかを決定
    setHasExistingTickets(hasTickets);

    if (hasTickets) {
      // 仮のチケットデータを設定
      setFateTickets([
        { id: "1", batch_id: "batch1", position: 1, shop_name: "Coffee Shop A", drawn_by_id: null, drawn_at: null },
        { id: "2", batch_id: "batch1", position: 2, shop_name: "Coffee Shop B", drawn_by_id: null, drawn_at: null },
        { id: "3", batch_id: "batch1", position: 3, shop_name: "Coffee Shop C", drawn_by_id: null, drawn_at: null },
        { id: "4", batch_id: "batch1", position: 4, shop_name: "Coffee Shop A", drawn_by_id: null, drawn_at: null },
        { id: "5", batch_id: "batch1", position: 5, shop_name: "Coffee Shop D", drawn_by_id: null, drawn_at: null },
      ]);
    } else {
      setFateTickets([]);
    }
  };

  // 運命の比重変更時の処理
  const handleDestinyRatioChange = (shopId: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    // 0〜10の範囲に制限
    const limitedValue = Math.min(Math.max(numValue, 0), 10);
    
    setShops(shops.map(shop => 
      shop.id === shopId ? { ...shop, destiny_ratio: limitedValue } : shop
    ));
  };

  // チケット選択時の処理
  const handleTicketSelect = (ticketId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedTickets([...selectedTickets, ticketId]);
    } else {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    }
  };

  // 全チケット選択/解除の処理
  const handleSelectAllTickets = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedTickets(fateTickets.map(ticket => ticket.id));
    } else {
      setSelectedTickets([]);
    }
  };

  // 運命チケット作成処理
  const handleCreateFateTickets = () => {
    setIsLoading(true);
    // 実際の実装では、ここでAPIを呼び出してチケットを作成する
    // 仮の処理として、3秒後に完了したことにする
    setTimeout(() => {
      setIsLoading(false);
      setHasExistingTickets(true);
      // 仮のチケットデータを設定
      setFateTickets([
        { id: "1", batch_id: "batch1", position: 1, shop_name: "Coffee Shop A", drawn_by_id: null, drawn_at: null },
        { id: "2", batch_id: "batch1", position: 2, shop_name: "Coffee Shop B", drawn_by_id: null, drawn_at: null },
        { id: "3", batch_id: "batch1", position: 3, shop_name: "Coffee Shop C", drawn_by_id: null, drawn_at: null },
        { id: "4", batch_id: "batch1", position: 4, shop_name: "Coffee Shop A", drawn_by_id: null, drawn_at: null },
        { id: "5", batch_id: "batch1", position: 5, shop_name: "Coffee Shop D", drawn_by_id: null, drawn_at: null },
      ]);
    }, 3000);
  };

  // 選択したチケットを削除する処理
  const handleDeleteSelectedTickets = () => {
    if (selectedTickets.length === 0) return;
    
    // 実際の実装では、ここでAPIを呼び出してチケットを論理削除する
    // 仮の処理として、選択したチケットを配列から削除する
    setFateTickets(fateTickets.filter(ticket => !selectedTickets.includes(ticket.id)));
    setSelectedTickets([]);
    
    // すべてのチケットが削除された場合
    if (selectedTickets.length === fateTickets.length) {
      setHasExistingTickets(false);
    }
  };

  // 運命チケット再作成処理
  const handleRecreateTickets = () => {
    // 実際の実装では、既存のチケットを論理削除してから新しいチケットを作成する
    setIsLoading(true);
    // 仮の処理として、3秒後に完了したことにする
    setTimeout(() => {
      setIsLoading(false);
      // 仮のチケットデータを設定（再作成されたことを示すために異なるデータにする）
      setFateTickets([
        { id: "6", batch_id: "batch2", position: 1, shop_name: "Coffee Shop B", drawn_by_id: null, drawn_at: null },
        { id: "7", batch_id: "batch2", position: 2, shop_name: "Coffee Shop A", drawn_by_id: null, drawn_at: null },
        { id: "8", batch_id: "batch2", position: 3, shop_name: "Coffee Shop D", drawn_by_id: null, drawn_at: null },
        { id: "9", batch_id: "batch2", position: 4, shop_name: "Coffee Shop C", drawn_by_id: null, drawn_at: null },
        { id: "10", batch_id: "batch2", position: 5, shop_name: "Coffee Shop A", drawn_by_id: null, drawn_at: null },
      ]);
      setSelectedTickets([]);
    }, 3000);
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">開催日</label>
              <Select 
                value={selectedDateId} 
                onValueChange={handleDateChange}
                disabled={!selectedEventId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="開催日を選択" />
                </SelectTrigger>
                <SelectContent>
                  {eventDates
                    .filter(date => date.event_id === selectedEventId)
                    .map((date) => (
                      <SelectItem key={date.id} value={date.id}>
                        {date.date}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 出店者一覧 */}
      {selectedDateId && shops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>出店者一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>店舗番号</TableHead>
                  <TableHead>店名</TableHead>
                  <TableHead>運命の比重 (0-10)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>{shop.shop_number}</TableCell>
                    <TableCell>{shop.shop_name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={shop.destiny_ratio}
                        onChange={(e) => handleDestinyRatioChange(shop.id, e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 運命チケット管理 */}
      {selectedDateId && shops.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>運命チケット管理</CardTitle>
            <div className="space-x-2">
              {hasExistingTickets ? (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteSelectedTickets}
                    disabled={selectedTickets.length === 0 || isLoading}
                  >
                    選択したチケットを削除
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRecreateTickets}
                    disabled={isLoading}
                  >
                    再作成
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleCreateFateTickets}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      作成中...
                    </>
                  ) : (
                    "作成"
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Spinner className="h-8 w-8" />
                <span className="ml-2">運命のチケットを生成中...</span>
              </div>
            ) : hasExistingTickets ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedTickets.length === fateTickets.length && fateTickets.length > 0}
                          onCheckedChange={handleSelectAllTickets}
                        />
                      </TableHead>
                      <TableHead>バッチID</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>店名</TableHead>
                      <TableHead>抽選者ID</TableHead>
                      <TableHead>抽選日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fateTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedTickets.includes(ticket.id)}
                            onCheckedChange={(checked) => handleTicketSelect(ticket.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>{ticket.batch_id}</TableCell>
                        <TableCell>{ticket.position}</TableCell>
                        <TableCell>{ticket.shop_name}</TableCell>
                        <TableCell>{ticket.drawn_by_id || "-"}</TableCell>
                        <TableCell>{ticket.drawn_at || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-sm text-gray-500">
                  {fateTickets.length}件のチケットが表示されています
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">
                運命のチケットはまだ作成されていません。「作成」ボタンをクリックして生成してください。
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 