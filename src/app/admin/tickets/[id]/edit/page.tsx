"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type PriceSchedule = {
  price: number;
  validFrom: string;
  validUntil: string;
};

const TICKET_CATEGORIES = ["当日券", "前売り券", "追加券"] as const;
type TicketCategory = typeof TICKET_CATEGORIES[number];

type TicketType = {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  quantity: number;
  priceSchedules: PriceSchedule[];
};

// TODO: APIから実データを取得するように修正
const mockTicket: TicketType = {
  id: "1",
  title: "当日3枚券",
  description: "当日購入可能な3枚セットチケット",
  category: "当日券",
  quantity: 3,
  priceSchedules: [
    {
      price: 3000,
      validFrom: "2025-04-01T00:00",
      validUntil: "2025-04-02T23:59",
    },
  ],
};

import React from 'react';

export default function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  // paramsをReact.use()でアンラップしてから使用する
  const unwrappedParams = React.use(params);
  const ticketId = unwrappedParams.id;
  
  return <EditTicketContent ticketId={ticketId} />;
}

function EditTicketContent({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "前売り券" as TicketCategory,
    quantity: 3,
  });

  const [priceSchedules, setPriceSchedules] = useState<PriceSchedule[]>([
    { price: 0, validFrom: "", validUntil: "" },
  ]);

  useEffect(() => {
    // TODO: APIからチケット種別データを取得
    // 実際のAPI実装では、ticketIdを使用してデータを取得する
    console.log('チケットID:', ticketId);
    const ticket = mockTicket; // 実際にはAPIから取得
    setFormData({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      quantity: ticket.quantity,
    });
    setPriceSchedules(ticket.priceSchedules);
  }, [ticketId]);

  const addPriceSchedule = () => {
    setPriceSchedules([
      ...priceSchedules,
      { price: 0, validFrom: "", validUntil: "" },
    ]);
  };

  const removePriceSchedule = (index: number) => {
    setPriceSchedules(priceSchedules.filter((_, i) => i !== index));
  };

  const updatePriceSchedule = (
    index: number,
    field: keyof PriceSchedule,
    value: string | number
  ) => {
    const newSchedules = [...priceSchedules];
    if (field === "price") {
      newSchedules[index][field] = value as number;
    } else {
      newSchedules[index][field] = value as string;
    }
    setPriceSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: APIを呼び出してチケット種別を更新
    console.log({ id: ticketId, ...formData, priceSchedules });
    router.push("/admin/tickets");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          チケット種別編集
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          チケット種別の情報を編集してください
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
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                カテゴリ
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as TicketCategory,
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
                <div className="mt-1">
                  <input
                    type="number"
                    required
                    min="0"
                    value={schedule.price}
                    onChange={(e) =>
                      updatePriceSchedule(
                        index,
                        "price",
                        parseInt(e.target.value)
                      )
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
            更新
          </button>
        </div>
      </form>
    </div>
  );
}