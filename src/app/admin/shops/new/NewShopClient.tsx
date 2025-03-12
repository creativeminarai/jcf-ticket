"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { generateShopCode, getDefaultAttendancePattern } from "@/lib/utils/shop-code";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Event } from "@/types/database.types";

const ROAST_LEVELS = [
  "ライト",
  "シナモン",
  "ミディアム",
  "ハイ",
  "シティ",
  "フルシティ",
  "フレンチ",
  "イタリアン",
] as const;
type RoastLevel = typeof ROAST_LEVELS[number];

interface NewShopClientProps {
  events: Event[];
}

export default function NewShopClient({ events }: NewShopClientProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({
    shopNumber: "", // 店舗番号（3桁）
    shopName: "",
    coffeeName: "",
    greeting: "",
    roastLevel: "ミディアム" as RoastLevel,
    prUrl: "",
    destinyRatio: 0.3,
    ticketCount: 100,
    notes: "",
  });

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // イベント選択時の処理
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e.id === eventId);
    setSelectedEvent(event || null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: 実際のアップロード処理を実装
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      alert('イベントを選択してください');
      return;
    }
    
    try {
      const supabase = createClientComponentClient();
      // 出席パターンの生成やデフォルト値の設定
      const attendancePattern = getDefaultAttendancePattern(); // デフォルトで土日出席

      // 適切なshop_codeの生成
      const shop_code = generateShopCode({
        eventNumber: selectedEvent.event_number || 0,
        shopType: "c", // デフォルトでコーヒー出店者
        shopNumber: formData.shopNumber,
        attendancePattern,
      });
      
      // Shopテーブルに新規登録
      const { data, error } = await supabase
        .from('Shop')
        .insert([
          {
            shop_code,
            shop_name: formData.shopName,
            coffee_name: formData.coffeeName,
            greeting: formData.greeting,
            roast_level: formData.roastLevel,
            pr_url: formData.prUrl,
            destiny_ratio: Math.round(formData.destinyRatio * 10), // 0〜10の整数値で保存
            ticket_count: formData.ticketCount,
            image_url: imageUrl, // 実際の実装ではアップロードしたURLを使用
            notes: formData.notes,
            event_id: selectedEvent.id // イベントIDを関連付け
          }
        ])
        .select();

      if (error) {
        throw new Error(`店舗情報の登録に失敗しました: ${error.message}`);
      }

      alert('新規店舗を登録しました');
      router.push('/admin/shops');
    } catch (error) {
      if (error instanceof Error) {
        alert(`エラーが発生しました: ${error.message}`);
      } else {
        alert('予期せぬエラーが発生しました');
      }
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">新規出店者登録</h1>
        <p className="mt-2 text-sm text-gray-700">
          新しい出店者の情報を入力してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本情報 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">基本情報</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* イベント選択 */}
            <div className="sm:col-span-2">
              <Label htmlFor="event" className="block text-sm font-medium text-gray-700">
                イベント選択
              </Label>
              <Select
                value={selectedEventId}
                onValueChange={handleEventChange}
              >
                <SelectTrigger id="event" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
                  <SelectValue placeholder="イベントを選択してください" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id} className="bg-white hover:bg-gray-100">
                      {event.name || `第${event.event_number}回`} {event.EventDate && event.EventDate.length > 0 ? `(${new Date(event.EventDate[0].date).toLocaleDateString()})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedEventId && (
                <p className="mt-1 text-sm text-red-500">イベントを選択してください</p>
              )}
            </div>

            <div>
              <label
                htmlFor="shopNumber"
                className="block text-sm font-medium text-gray-700"
              >
                店舗番号（3桁）
              </label>
              <input
                type="text"
                name="shopNumber"
                id="shopNumber"
                required
                pattern="[0-9]{3}"
                maxLength={3}
                value={formData.shopNumber}
                onChange={(e) =>
                  setFormData({ ...formData, shopNumber: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="shopName"
                className="block text-sm font-medium text-gray-700"
              >
                出店者名
              </label>
              <input
                type="text"
                name="shopName"
                id="shopName"
                required
                value={formData.shopName}
                onChange={(e) =>
                  setFormData({ ...formData, shopName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="coffeeName"
                className="block text-sm font-medium text-gray-700"
              >
                出品コーヒー名
              </label>
              <input
                type="text"
                name="coffeeName"
                id="coffeeName"
                required
                value={formData.coffeeName}
                onChange={(e) =>
                  setFormData({ ...formData, coffeeName: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="greeting"
                className="block text-sm font-medium text-gray-700"
              >
                ご挨拶
              </label>
              <textarea
                id="greeting"
                name="greeting"
                rows={3}
                value={formData.greeting}
                onChange={(e) =>
                  setFormData({ ...formData, greeting: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="roastLevel"
                className="block text-sm font-medium text-gray-700"
              >
                焙煎度
              </label>
              <select
                id="roastLevel"
                name="roastLevel"
                value={formData.roastLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roastLevel: e.target.value as RoastLevel,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                {ROAST_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="destinyRatio"
                className="block text-sm font-medium text-gray-700"
              >
                運命の出会い確率（0.0〜1.0）
              </label>
              <input
                type="number"
                name="destinyRatio"
                id="destinyRatio"
                min="0"
                max="1"
                step="0.1"
                value={formData.destinyRatio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    destinyRatio: parseFloat(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="ticketCount"
                className="block text-sm font-medium text-gray-700"
              >
                チケット枚数
              </label>
              <input
                type="number"
                name="ticketCount"
                id="ticketCount"
                min="1"
                value={formData.ticketCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ticketCount: parseInt(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="prUrl"
                className="block text-sm font-medium text-gray-700"
              >
                PR URL
              </label>
              <input
                type="url"
                name="prUrl"
                id="prUrl"
                value={formData.prUrl}
                onChange={(e) =>
                  setFormData({ ...formData, prUrl: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* 画像アップロード */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">画像</h2>

          <div className="mt-2">
            {previewUrl ? (
              <div className="relative h-48 w-48 overflow-hidden rounded-lg">
                <Image
                  className="h-full w-full object-cover"
                  src={previewUrl}
                  alt="プレビュー"
                  width={192}
                  height={192}
                />
              </div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <span className="text-sm text-gray-500">画像なし</span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-4"
            />
          </div>
        </div>

        {/* 備考 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">備考</h2>

          <div>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/shops")}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!selectedEventId}
            className={`ml-3 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedEventId
                ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            登録
          </button>
        </div>
      </form>
    </div>
  );
}
