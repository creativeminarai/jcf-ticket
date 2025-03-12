import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shop, Event } from "@/types/shop";
import { parseShopCode, formatAttendancePattern } from "@/lib/utils/shop-code";
import * as React from "react";
import { cn } from "@/lib/utils";

// テーブルコンポーネント
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

// バッジコンポーネント
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'outline', ...props }: BadgeProps) {
  // userSelectプロパティを追加して、テキスト選択を防止
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
        variant === 'default' && "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        variant === 'secondary' && "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === 'destructive' && "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        variant === 'outline' && "text-foreground",
        className
      )} 
      {...props} 
    />
  )
}

interface ShopListProps {
  shops: Shop[];
  events: Event[];
  onDeleteShop?: (id: string) => void;
  isLoading?: boolean;
}

export default function ShopList({ shops, events, onDeleteShop, isLoading = false }: ShopListProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  
  // 選択されたイベントの店舗をフィルタリングし、番号順にソート
  const filteredShops = selectedEventId
    ? shops.filter(shop => {
        const { eventNumber } = parseShopCode(shop.shop_code);
        const selectedEvent = events.find(e => e.id === selectedEventId);
        return selectedEvent && selectedEvent.event_number === eventNumber;
      }).sort((a, b) => {
        const { shopNumber: aNum } = parseShopCode(a.shop_code);
        const { shopNumber: bNum } = parseShopCode(b.shop_code);
        return parseInt(aNum) - parseInt(bNum);
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
                <TableHead>番号</TableHead>
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
                    <TableCell className="font-semibold text-center">
                      {shopNumber}
                    </TableCell>
                    <TableCell className="font-mono">
                      {shop.shop_code}
                      <div className="text-xs text-muted-foreground mt-1">
                        種別: {shopTypeLabel}
                      </div>
                    </TableCell>
                    <TableCell>{shop.name}</TableCell>
                    <TableCell>{shop.owner_name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className="cursor-default"
                      >
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
