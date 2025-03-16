"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from "@/types/database.types";

type PriceSchedule = {
  price: string;
  validFrom: string;
  validUntil: string;
};

const TICKET_CATEGORIES = ["当日券", "前売り券", "追加券"] as const;
type TicketCategory = typeof TICKET_CATEGORIES[number];

export default function NewTicketPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ticket_category: "前売り券" as TicketCategory,
    quantity: 3,
  });

  const [priceSchedules, setPriceSchedules] = useState<PriceSchedule[]>([
    { price: "", validFrom: "", validUntil: "" },
  ]);

  const addPriceSchedule = () => {
    setPriceSchedules([
      ...priceSchedules,
      { price: "", validFrom: "", validUntil: "" },
    ]);
  };

  const removePriceSchedule = (index: number) => {
    setPriceSchedules(priceSchedules.filter((_, i) => i !== index));
  };

  const updatePriceSchedule = (
    index: number,
    field: keyof PriceSchedule,
    value: string
  ) => {
    const newSchedules = [...priceSchedules];
    newSchedules[index][field] = value;
    setPriceSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 価格スケジュールのバリデーション - 数値変換を送信時に行う
      const validPriceSchedules = priceSchedules.filter(
        schedule => {
          const priceNum = parseFloat(schedule.price);
          return !isNaN(priceNum) && priceNum > 0 && schedule.validFrom && schedule.validUntil;
        }
      );
      
      if (validPriceSchedules.length === 0) {
        throw new Error('少なくとも1つの有効な価格スケジュールを設定してください');
      }
      
      const supabase = createClientComponentClient<Database>();
      
      // チケット種別の登録
      const { data: ticketData, error: ticketError } = await supabase
        .from('TicketType')
        .insert({
          title: formData.title,
          description: formData.description,
          ticket_category: formData.ticket_category,
          quantity: formData.quantity,
        })
        .select();
      
      if (ticketError) {
        throw new Error(`チケット種別の登録に失敗しました: ${ticketError.message}`);
      }
      
      if (!ticketData || ticketData.length === 0) {
        throw new Error('チケットデータが正しく返されませんでした');
      }
      
      const ticketTypeId = ticketData[0].id;
      
      // 価格スケジュールの登録 - 送信時に数値変換
      const priceRecords = validPriceSchedules.map(schedule => ({
        ticket_type_id: ticketTypeId,
        price: parseFloat(schedule.price), // 文字列から数値に変換
        valid_from: schedule.validFrom,
        valid_until: schedule.validUntil
      }));
      
      const { error: priceError } = await supabase
        .from('TicketPrice')
        .insert(priceRecords);
      
      if (priceError) {
        throw new Error(`価格スケジュールの登録に失敗しました: ${priceError.message}`);
      }
      
      alert('チケット種別を登録しました');
      router.push("/admin/tickets");
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
        <h1 className="text-2xl font-semibold text-gray-900">
          新規チケット種別登録
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          新しいチケット種別の情報を入力してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* チケット基本情報 */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <h2 className="text-lg font-medium text-gray-900">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                チケット名
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                説明
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="ticket_category"
                className="block text-sm font-medium text-gray-700"
              >
                カテゴリ
              </label>
              <select
                id="ticket_category"
                name="ticket_category"
                value={formData.ticket_category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ticket_category: e.target.value as TicketCategory,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                枚数（セット数）
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* 価格スケジュール */}
        <div className="space-y-6 bg-white p-6 shadow sm:rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">価格スケジュール</h2>
            <button
              type="button"
              onClick={addPriceSchedule}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
            >
              価格を追加
            </button>
          </div>

          {priceSchedules.map((schedule, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 first:border-t-0 first:pt-0 sm:grid-cols-4"
            >
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  価格
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">¥</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="例: 1000"
                    value={schedule.price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      updatePriceSchedule(index, "price", value);
                    }}
                    className="block w-full pl-7 pr-12 py-2 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  開始日時
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    required
                    value={schedule.validFrom}
                    onChange={(e) =>
                      updatePriceSchedule(index, "validFrom", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  終了日時
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    required
                    value={schedule.validUntil}
                    onChange={(e) =>
                      updatePriceSchedule(index, "validUntil", e.target.value)
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {priceSchedules.length > 1 && (
                <div className="flex items-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removePriceSchedule(index)}
                    className="rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
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
            登録
          </button>
        </div>
      </form>
    </div>
  );
}