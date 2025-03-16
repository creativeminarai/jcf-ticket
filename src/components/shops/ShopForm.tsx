import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/types/database.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { ShopAttendance, EventDateWithAttendance } from "@/types/shopAttendance";
import { useToast } from "../ui/use-toast";

// 型定義
type Shop = Database['public']['Tables']['Shop']['Row'];
type Event = Database['public']['Tables']['Event']['Row'] & {
  EventDate: Database['public']['Tables']['EventDate']['Row'][]
};

interface ShopFormProps {
  shop?: Shop | null;
  event?: Event | null;
  events: Event[];
  onSubmit: (data: Shop, attendances?: ShopAttendance[]) => void;
  isLoading?: boolean;
}

// フォームバリデーションスキーマ
const shopFormSchema = z.object({
  shop_number: z.string().min(1, "店舗番号は必須です"),
  shop_name: z.string().min(1, "出店者名は必須です"),
  coffee_name: z.string().min(1, "出品コーヒー名は必須です"),
  greeting: z.string().optional(),
  roast_level: z.string().min(1, "焙煎度は必須です"),
  pr_url: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  destiny_ratio: z.number().int().min(0, "運命の比重は0以上の値を指定してください").max(10, "運命の比重は10以下の値を指定してください"),
  ticket_count: z.number().int().min(0, "チケット枚数は0以上の整数を指定してください"),
  image_url: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),
  notes: z.string().optional(),
  selected_event_id: z.string().min(1, "イベントを選択してください"),
  attendance_date_ids: z.array(z.string()).optional(),

});

// 店舗コードをパースする関数
function parseShopCode(shopCode: string) {
  // 正規表現で店舗コードをパース
  // フォーマット: イベント番号-c店舗番号
  // 例: 0073-c0016
  const match = shopCode.match(/^(\d+)-c(\d+)$/);  
  
  if (match) {
    // 新しいフォーマットに一致した場合
    return {
      shopNumber: match[2],  // 店舗番号部分
      attendanceDates: []    // 新フォーマットでは日付情報は含まない
    };
  }
  
  // 旧フォーマットやその他のフォーマットの場合は、数字のみを抽出
  const shopNumber = shopCode.replace(/\D/g, '');
  
  return {
    shopNumber: shopNumber.slice(-4),  // 後方4桁を店舗番号として使用
    attendanceDates: []
  };
}

// 店舗コードを生成する関数
function generateShopCode(shopNumber: string, attendanceDates: string[]): string {
  // 073 (プレフィックス)
  const prefix = '073';
  
  // c0016 (店舗番号部分)
  // 数字のみの入力を「c」+ゼロ埋めした4桁の数字に変換
  const paddedNumber = shopNumber.padStart(4, '0');
  const shopNumberPart = 'c' + paddedNumber;
  
  // 0000011 (日付部分) - 7桁で固定
  // 重要: 日付部分は右から左に向かってインデックスが増える
  // つまり、最初の日付は一番右のビットになる
  let datePart = '0000000';
  attendanceDates.forEach(dateIndex => {
    const index = parseInt(dateIndex, 10);
    if (index >= 0 && index < datePart.length) {
      // インデックスを反転させて正しい位置に配置
      const reverseIndex = datePart.length - 1 - index;
      // 該当する位置を1に変更
      datePart = datePart.substring(0, reverseIndex) + '1' + datePart.substring(reverseIndex + 1);
    }
  });
  
  // ハイフン区切りの形式にフォーマット
  return prefix + '-' + shopNumberPart + '-' + datePart;
}

export default function ShopForm({ shop, event: initialEvent, events, onSubmit, isLoading = false }: ShopFormProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEvent?.id || "");
  // 初期値として関数を使用して、nullやundefinedを適切に処理する
  const [selectedEvent, setSelectedEvent] = useState<Event | null | undefined>(() => {
    return initialEvent || null;
  });
  
  // 出店日の選択肢
  const [eventDates, setEventDates] = useState<EventDateWithAttendance[]>([]);
  const [isLoadingAttendances, setIsLoadingAttendances] = useState(false);
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  // フォームの初期化
  const form = useForm<z.infer<typeof shopFormSchema>>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      shop_number: shop?.shop_code?.replace(/[^0-9]/g, '') || "",
      shop_name: shop?.shop_name || "",
      coffee_name: shop?.coffee_name || "",
      greeting: shop?.greeting || "",
      roast_level: shop?.roast_level || "",
      pr_url: shop?.pr_url || "",
      destiny_ratio: shop?.destiny_ratio || 5,
      ticket_count: shop?.ticket_count || 100,
      image_url: shop?.image_url || "",
      notes: shop?.notes || "",
      selected_event_id: initialEvent?.id || "",
      attendance_date_ids: [],

    },
  });

  // イベント選択時の処理
  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      setEventDates([]);
      return;
    }
    
    const event = events.find(e => e.id === selectedEventId);
    if (event) {
      setSelectedEvent(event);
      setIsLoadingAttendances(true);
      
      // イベント日程を取得
      if (event.EventDate && Array.isArray(event.EventDate)) {
        const eventDatesWithAttendance = event.EventDate.map(date => ({
          id: date.id,
          date: date.date,
          time: date.time || '',
          event_id: date.event_id,
          isAttending: false,
          shopAttendanceId: undefined
        }));
        
        // ショップIDがある場合は、そのイベントの出店情報を取得
        if (shop?.id) {
          // ShopAttendanceテーブルから、選択されたイベントの出店情報を取得
          // 論理削除されていないデータのみ取得する
          supabase
            .from('ShopAttendance')
            .select('*, EventDate(*)')
            .eq('shop_id', shop.id)
            .is('deleted_at', null)
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching shop attendances:', error);
                toast({
                  title: "エラー",
                  description: "出店情報の取得に失敗しました",
                  variant: "destructive"
                });
              } else if (data) {
                // 出店情報を反映
                const updatedEventDates = eventDatesWithAttendance.map(eventDate => {
                  const attendance = data.find(att => att.event_date_id === eventDate.id);
                  if (attendance) {
                    return {
                      ...eventDate,
                      isAttending: true,
                      shopAttendanceId: attendance.id,
                      shopAttendanceNotes: attendance.notes
                    };
                  }
                  return eventDate;
                });
                
                setEventDates(updatedEventDates);
                
                // 出店日のIDの配列をフォームにセット
                const attendanceIds = updatedEventDates
                  .filter(date => date.isAttending)
                  .map(date => date.id);
                form.setValue('attendance_date_ids', attendanceIds);
                

              }
              setIsLoadingAttendances(false);
              console.log('Loaded attendances:', data);
            });
        } else {
          setEventDates(eventDatesWithAttendance);
          setIsLoadingAttendances(false);
        }
      } else {
        setEventDates([]);
        setIsLoadingAttendances(false);
      }
    }
  }, [selectedEventId, events, shop?.id, form, supabase, toast]);

  // 既存店舗データがある場合の初期値設定
  useEffect(() => {
    if (shop && initialEvent) {
      // 既存の店舗データがある場合は、フォームの値を設定
      // 店舗コードから店舗番号を抽出
      const { shopNumber } = parseShopCode(shop.shop_code || '');
      // 先頭の0を除去して数値として店舗番号を設定
      const numericShopNumber = shopNumber === '' ? '' : String(parseInt(shopNumber, 10));
      form.setValue("shop_number", numericShopNumber);
      form.setValue("shop_name", shop.shop_name || '');
      form.setValue("coffee_name", shop.coffee_name || '');
      form.setValue("greeting", shop.greeting || "");
      form.setValue("roast_level", shop.roast_level || '');
      form.setValue("pr_url", shop.pr_url || "");
      form.setValue("destiny_ratio", shop.destiny_ratio || 5);
      form.setValue("ticket_count", shop.ticket_count || 1);
      form.setValue("image_url", shop.image_url || "");
      form.setValue("notes", shop.notes || "");
      form.setValue("selected_event_id", initialEvent.id);
    }
  }, [shop, initialEvent, form]);

  // フォーム送信処理
  const handleFormSubmit = async (data: z.infer<typeof shopFormSchema>) => {
    if (!selectedEvent) return;
    
    // 店舗番号から数値のみを抽出し、空白や文字を除去
    const shopNumberNumeric = data.shop_number.replace(/\D/g, '');
    
    // 店舗コードを生成 (「イベント番号-c店舗番号」の形式)
    // イベント番号と店舗番号を適切にゼロ埋め
    const shopCode = `${selectedEvent.event_number?.toString().padStart(3, '0')}-c${shopNumberNumeric.padStart(4, '0')}`;
    
    // 送信データの作成
    const submitData: Shop = {
      id: shop?.id || "",
      name: shop?.name || "Shop", // 必須フィールド
      description: shop?.description || null,
      image_url: shop?.image_url || null,
      shop_code: shopCode,
      shop_name: data.shop_name,
      coffee_name: data.coffee_name,
      greeting: data.greeting || null,
      roast_level: data.roast_level,
      pr_url: data.pr_url || null,
      destiny_ratio: data.destiny_ratio,
      ticket_count: data.ticket_count,
      notes: data.notes || null,
      deleted_at: shop?.deleted_at || null,
      created_at: shop?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 出店情報の配列を作成
    const attendanceDateIds = data.attendance_date_ids || [];
    
    const attendances: ShopAttendance[] = attendanceDateIds.map(dateId => ({
      id: eventDates.find(date => date.id === dateId)?.shopAttendanceId || '',
      shop_id: shop?.id || '',
      event_date_id: dateId
    }));
    
    onSubmit(submitData, attendances);
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{shop ? "店舗情報の編集" : "新規店舗登録"}</CardTitle>
        <CardDescription>
          {shop ? "店舗情報を編集してください" : "イベントを選択して店舗情報を入力してください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* イベント選択 */}
            <FormField
              control={form.control}
              name="selected_event_id"
              render={({ field }) => (
                <FormItem className="w-full max-w-md">
                  <FormLabel>イベント</FormLabel>
                  <Select
                    disabled={!!initialEvent || isLoading}
                    value={selectedEventId}
                    onValueChange={(value) => {
                      setSelectedEventId(value);
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="イベントを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id} className="bg-white hover:bg-gray-100">
                          {event.name || `第${event.event_number}回`} {event.EventDate && event.EventDate.length > 0 ? `(${new Date(event.EventDate[0].date).toLocaleDateString()})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* イベントが選択されているか、既存店舗編集の場合のみ詳細フォームを表示 */}
            {(selectedEventId || shop) && (
              <div className="mt-6 space-y-6">
                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shop_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>店舗番号</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={isLoading} 
                            placeholder="例: 16"
                            onChange={(e) => {
                              // 数字のみ許可
                              const value = e.target.value.replace(/\D/g, '');
                              // 先頭の0を除去して数値として処理し、店舗番号として設定
                              const numericValue = value === '' ? '' : String(parseInt(value, 10));
                              field.onChange(numericValue);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shop_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>店舗名</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 出店日選択 */}
                {eventDates.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="attendance_date_ids"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>出店日</FormLabel>
                            {isLoadingAttendances && (
                              <div className="ml-2 inline-block text-sm text-gray-500">読み込み中...</div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {eventDates.map((eventDate) => (
                              <div key={eventDate.id} className="border p-4 rounded-lg">
                                <FormField
                                  control={form.control}
                                  name="attendance_date_ids"
                                  render={({ field }) => {
                                    // 選択されているかチェック
                                    const isChecked = field.value?.includes(eventDate.id) || false;
                                    
                                    return (
                                      <div className="mb-2">
                                        <FormItem
                                          className="flex flex-row items-center space-x-2 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={isChecked}
                                              disabled={isLoading || isLoadingAttendances}
                                              onCheckedChange={(checked) => {
                                                const currentValues = field.value || [];
                                                
                                                // チェックボックスの状態に応じて値を更新
                                                const newValues = checked
                                                  ? [...currentValues, eventDate.id]
                                                  : currentValues.filter((value) => value !== eventDate.id);
                                                
                                                field.onChange(newValues);
                                                
                                                // イベント日付の状態も更新
                                                const updatedEventDates = eventDates.map(date => {
                                                  if (date.id === eventDate.id) {
                                                    return {
                                                      ...date,
                                                      isAttending: !!checked
                                                    };
                                                  }
                                                  return date;
                                                });
                                                setEventDates(updatedEventDates);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-medium text-base">
                                            {new Date(eventDate.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            {eventDate.time && ` ${eventDate.time}`}
                                          </FormLabel>
                                        </FormItem>
                                      </div>
                                    );
                                  }}
                                />
                                

                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* コーヒー情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="coffee_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>コーヒー名</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="roast_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>焙煎度</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="焙煎度を選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="極浅煎り">極浅煎り</SelectItem>
                            <SelectItem value="浅煎り">浅煎り</SelectItem>
                            <SelectItem value="中浅煎り">中浅煎り</SelectItem>
                            <SelectItem value="中煎り">中煎り</SelectItem>
                            <SelectItem value="中深煎り">中深煎り</SelectItem>
                            <SelectItem value="深煎り">深煎り</SelectItem>
                            <SelectItem value="極深煎り">極深煎り</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* 挨拶 */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="greeting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>挨拶</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            disabled={isLoading}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* PR URL */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="pr_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PR URL</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 画像URL */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>画像URL</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 備考 */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>備考</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            disabled={isLoading}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* 運命の比重とチケット枚数 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="destiny_ratio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>運命の比重 (0～10)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            disabled={isLoading}
                            value={field.value === undefined || field.value === null ? "" : field.value.toString()}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === "") {
                                // 空の場合はnullを設定
                                field.onChange(null);
                              } else {
                                // 数値の場合は変換して設定
                                const numValue = parseInt(inputValue, 10);
                                if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
                                  field.onChange(numValue);
                                } else if (!isNaN(numValue)) {
                                  // 0～10の範囲外の数値の場合、範囲内にクリップ
                                  field.onChange(Math.min(Math.max(numValue, 0), 10));
                                }
                                // NaNの場合は何もしない
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ticket_count"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel>チケット枚数</FormLabel>
                          <Select
                            disabled={isLoading}
                            onValueChange={(value) => {
                              field.onChange(parseInt(value, 10));
                            }}
                            value={field.value?.toString() || "1"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="チケット枚数を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1枚</SelectItem>
                              <SelectItem value="2">2枚</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                
                <div className="mt-4">
                  <Button type="submit" disabled={isLoading || !selectedEvent}>
                    {isLoading ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
