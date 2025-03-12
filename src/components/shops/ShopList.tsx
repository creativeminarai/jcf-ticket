import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shop, Event } from "@/types/shop";
import { parseShopCode, formatAttendancePattern } from "@/lib/utils/shop-code";

interface ShopListProps {
  shops: Shop[];
  events: Event[];
  onDeleteShop?: (id: string) => void;
  isLoading?: boolean;
}

export default function ShopList({ shops, events, onDeleteShop, isLoading = false }: ShopListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  
  // 選択されたイベントの店舗をフィルタリング
  const filteredShops = selectedEventId
    ? shops.filter(shop => {
        const { eventNumber } = parseShopCode(shop.shop_code);
        const selectedEvent = events.find(e => e.id === selectedEventId);
        return selectedEvent && selectedEvent.event_number === eventNumber;
      })
    : [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>店舗一覧</CardTitle>
        <div className="flex items-center space-x-4">
          {/* イベント選択 */}
          <Select
            value={selectedEventId}
            onValueChange={setSelectedEventId}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="イベントを選択" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.event_number} - {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* 新規店舗登録ボタン */}
          {selectedEventId && (
            <Link href={`/admin/shops/new?event_id=${selectedEventId}`}>
              <Button disabled={isLoading}>
                新規店舗登録
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedEventId ? (
          <div className="text-center py-8 text-muted-foreground">
            イベントを選択してください
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            このイベントに登録された店舗はありません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>店舗コード</TableHead>
                <TableHead>店舗名</TableHead>
                <TableHead>オーナー</TableHead>
                <TableHead>出店パターン</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShops.map((shop) => {
                const { shopType, shopNumber, attendancePattern } = parseShopCode(shop.shop_code);
                const shopTypeLabel = 
                  shopType === 'c' ? '珈琲' :
                  shopType === 'f' ? '飲食' :
                  shopType === 'g' ? '物販' : '他';
                
                return (
                  <TableRow key={shop.id}>
                    <TableCell className="font-mono">
                      {shop.shop_code}
                      <div className="text-xs text-muted-foreground mt-1">
                        種別: {shopTypeLabel}, 番号: {shopNumber}
                      </div>
                    </TableCell>
                    <TableCell>{shop.name}</TableCell>
                    <TableCell>{shop.owner_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatAttendancePattern(attendancePattern)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/shops/${shop.id}/edit`}>
                          <Button variant="outline" size="sm" disabled={isLoading}>
                            編集
                          </Button>
                        </Link>
                        {onDeleteShop && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteShop(shop.id)}
                            disabled={isLoading}
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
