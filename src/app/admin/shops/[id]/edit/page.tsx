"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

type Shop = {
  id: string;
  shopNumber: string;
  shopName: string;
  coffeeName: string;
  greeting: string;
  roastLevel: RoastLevel;
  prUrl: string;
  destinyRatio: number;
  ticketCount: number;
  imageUrl: string | null;
  notes: string;
};

// 型定義を更新
type ApiResponse = {
  error?: string;
  id?: string;
  shop_number?: string;
  shop_name?: string;
  coffee_name?: string;
  greeting?: string;
  roast_level?: string;
  pr_url?: string;
  destiny_ratio?: number;
  ticket_count?: number;
  image_url?: string | null;
  notes?: string;
};

import React from 'react';

export default function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
  // paramsをReact.use()でアンラップ
  const unwrappedParams = React.use(params);
  const shopId = unwrappedParams.id;
  
  return <EditShopContent shopId={shopId} />;
}

function EditShopContent({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventNumber: "", // 開催番号（3桁）
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

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await fetch(`/api/admin/shops/${shopId}`);
        const data: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '出店者情報の取得に失敗しました');
        }

        if (data.shop_number) {
          const [eventNumber, shopNumber] = data.shop_number.match(/.{1,3}/g) || ["", ""];
          
          setFormData({
            eventNumber,
            shopNumber,
            shopName: data.shop_name || "",
            coffeeName: data.coffee_name || "",
            greeting: data.greeting || "",
            roastLevel: (data.roast_level as RoastLevel) || "ミディアム",
            prUrl: data.pr_url || "",
            destinyRatio: data.destiny_ratio || 0,
            ticketCount: data.ticket_count || 0,
            notes: data.notes || "",
          });

          if (data.image_url) {
            setImageUrl(data.image_url);
            setPreviewUrl(data.image_url);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '出店者情報の取得に失敗しました');
        console.error('Shop data fetch error:', err);
      }
    };

    fetchShopData();
  }, [shopId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // ファイルをプレビュー表示
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // FormDataの準備
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('shopName', formData.shopName || 'shop');

        // 画像をアップロード
        const response = await fetch('/api/admin/shops/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '画像のアップロードに失敗しました');
        }

        // アップロードされた画像のURLを保存
        setImageUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
        console.error('Image upload error:', err);
        // エラー時はプレビューをクリア
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const shopNumber = `${formData.eventNumber}${formData.shopNumber}`;
      const response = await fetch(`/api/admin/shops/${shopId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopNumber,
          shopName: formData.shopName,
          coffeeName: formData.coffeeName,
          greeting: formData.greeting,
          roastLevel: formData.roastLevel,
          prUrl: formData.prUrl,
          destinyRatio: formData.destinyRatio,
          ticketCount: formData.ticketCount,
          imageUrl: imageUrl,
          notes: formData.notes,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '出店者情報の更新に失敗しました');
      }

      router.push("/admin/shops");
    } catch (err) {
      setError(err instanceof Error ? err.message : '出店者情報の更新に失敗しました');
      console.error('Shop update error:', err);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">出店者情報編集</h1>
        <p className="mt-2 text-sm text-gray-700">
          出店者の情報を編集してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本情報 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">基本情報</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="eventNumber"
                className="block text-sm font-medium text-gray-700"
              >
                開催番号（3桁）
              </label>
              <input
                type="text"
                name="eventNumber"
                id="eventNumber"
                required
                pattern="[0-9]{3}"
                maxLength={3}
                value={formData.eventNumber}
                onChange={(e) =>
                  setFormData({ ...formData, eventNumber: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
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
                name="greeting"
                id="greeting"
                rows={3}
                value={formData.greeting}
                onChange={(e) =>
                  setFormData({ ...formData, greeting: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* コーヒー情報 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">コーヒー情報</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                htmlFor="prUrl"
                className="block text-sm font-medium text-gray-700"
              >
                広報URL
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

        {/* チケット情報 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">チケット情報</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="destinyRatio"
                className="block text-sm font-medium text-gray-700"
              >
                運命の比重（0 ~ 10）
              </label>
              <input
                type="number"
                name="destinyRatio"
                id="destinyRatio"
                step="1"
                min="0"
                max="10"
                required
                value={Math.round(formData.destinyRatio * 10)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    destinyRatio: parseInt(e.target.value, 10) / 10,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">0〜10の整数値で指定してください</p>
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
                required
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
          </div>
        </div>

        {/* 画像アップロード */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">画像</h2>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              出店者画像
            </label>
            <div className="flex items-center space-x-6">
              {previewUrl && (
                <div className="h-32 w-32">
                  <Image
                    src={previewUrl}
                    alt="プレビュー"
                    className="h-32 w-32 rounded-lg object-cover"
                    width={128}
                    height={128}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* 備考 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">備考</h2>

          <div>
            <textarea
              name="notes"
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            更新
          </button>
        </div>
      </form>
    </div>
  );
}