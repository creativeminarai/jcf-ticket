"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from "@/types/database.types";
import React from 'react';

type PriceSchedule = {
  id?: string; // 既存の価格スケジュールにはIDがある
  price: string;
  validFrom: string;
  validUntil: string;
};

const TICKET_CATEGORIES = ["当日券", "前売り券", "追加券"] as const;
type TicketCategory = typeof TICKET_CATEGORIES[number];

export default function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  // paramsをReact.use()でアンラップしてから使用する
  const unwrappedParams = React.use(params);
  const ticketId = unwrappedParams.id;
  
  return <EditTicketContent ticketId={ticketId} />;
}

function EditTicketContent({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ticket_category: "前売り券" as TicketCategory,
    quantity: 3,
  });

  const [priceSchedules, setPriceSchedules] = useState<PriceSchedule[]>([
    { price: "", validFrom: "", validUntil: "" },
  ]);

  // Supabaseクライアントの初期化
  const supabase = createClientComponentClient<Database>();

  // チケット種別データの取得
  useEffect(() => {
    const fetchTicketData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // TicketTypeテーブルからデータを取得
        const { data: ticketData, error: ticketError } = await supabase
          .from('TicketType')
          .select('*')
          .eq('id', ticketId)
          .single();
        
        if (ticketError) {
          throw new Error(`チケットデータの取得に失敗しました: ${ticketError.message}`);
        }
        
        if (!ticketData) {
          throw new Error('チケットデータが見つかりませんでした');
        }
        
        // フォームデータを設定
        setFormData({
          title: ticketData.title,
          description: ticketData.description || "",
          ticket_category: ticketData.ticket_category as TicketCategory,
          quantity: ticketData.quantity,
        });
        
        // TicketPriceテーブルからデータを取得
        const { data: priceData, error: priceError } = await supabase
          .from('TicketPrice')
          .select('*')
          .eq('ticket_type_id', ticketId);
        
        if (priceError) {
          throw new Error(`価格データの取得に失敗しました: ${priceError.message}`);
        }
        
        // 価格スケジュールを設定
        if (priceData && priceData.length > 0) {
          const formattedPriceSchedules = priceData.map(price => ({
            id: price.id,
            price: price.price.toString(),
            validFrom: price.valid_from,
            validUntil: price.valid_until,
          }));
          setPriceSchedules(formattedPriceSchedules);
        } else {
          // 価格データがない場合は空の価格スケジュールを設定
          setPriceSchedules([{ price: "", validFrom: "", validUntil: "" }]);
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicketData();
  }, [ticketId, supabase]);

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
      setLoading(true);
      
      // 価格スケジュールのバリデーション
      const validPriceSchedules = priceSchedules.filter(
        schedule => {
          const priceNum = parseFloat(schedule.price);
          return !isNaN(priceNum) && priceNum > 0 && schedule.validFrom && schedule.validUntil;
        }
      );
      
      if (validPriceSchedules.length === 0) {
        throw new Error('少なくとも1つの有効な価格スケジュールを設定してください');
      }
      
      // チケット種別の更新
      const { error: ticketError } = await supabase
        .from('TicketType')
        .update({
          title: formData.title,
          description: formData.description,
          ticket_category: formData.ticket_category,
          quantity: formData.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (ticketError) {
        throw new Error(`チケット種別の更新に失敗しました: ${ticketError.message}`);
      }
      
      // 既存の価格スケジュールを取得
      const { data: existingPrices, error: fetchError } = await supabase
        .from('TicketPrice')
        .select('id')
        .eq('ticket_type_id', ticketId);
      
      if (fetchError) {
        throw new Error(`既存の価格データの取得に失敗しました: ${fetchError.message}`);
      }
      
      // 既存のIDのリスト
      const existingIds = existingPrices?.map(p => p.id) || [];
      
      // 更新対象と新規追加対象を分ける
      const toUpdate = validPriceSchedules.filter(p => p.id && existingIds.includes(p.id));
      const toInsert = validPriceSchedules.filter(p => !p.id);
      
      // 削除対象のIDを特定（既存のIDのうち、更新対象に含まれていないもの）
      const updateIds = toUpdate.map(p => p.id);
      const toDeleteIds = existingIds.filter(id => !updateIds.includes(id));
      
      // 更新処理
      for (const schedule of toUpdate) {
        const { error } = await supabase
          .from('TicketPrice')
          .update({
            price: parseFloat(schedule.price),
            valid_from: schedule.validFrom,
            valid_until: schedule.validUntil,
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id);
        
        if (error) {
          throw new Error(`価格スケジュールの更新に失敗しました: ${error.message}`);
        }
      }
      
      // 新規追加処理
      if (toInsert.length > 0) {
        const insertData = toInsert.map(schedule => ({
          ticket_type_id: ticketId,
          price: parseFloat(schedule.price),
          valid_from: schedule.validFrom,
          valid_until: schedule.validUntil,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        const { error } = await supabase
          .from('TicketPrice')
          .insert(insertData);
        
        if (error) {
          throw new Error(`価格スケジュールの追加に失敗しました: ${error.message}`);
        }
      }
      
      // 削除処理
      if (toDeleteIds.length > 0) {
        const { error } = await supabase
          .from('TicketPrice')
          .delete()
          .in('id', toDeleteIds);
        
        if (error) {
          throw new Error(`価格スケジュールの削除に失敗しました: ${error.message}`);
        }
      }
      
      alert('チケット種別を更新しました');
      router.push("/admin/tickets");
    } catch (error) {
      if (error instanceof Error) {
        alert(`エラーが発生しました: ${error.message}`);
      } else {
        alert('予期せぬエラーが発生しました');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">チケット種別編集</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => router.push("/admin/tickets")}
          >
            チケット一覧に戻る
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                タイトル
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                枚数
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                カテゴリ
              </label>
              <select
                id="category"
                name="category"
                value={formData.ticket_category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ticket_category: e.target.value as TicketCategory,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">価格スケジュール</h2>
              <button
                type="button"
                onClick={addPriceSchedule}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                + 追加
              </button>
            </div>

            {priceSchedules.map((schedule, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-gray-50"
              >
                <div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    有効期間開始
                  </label>
                  <input
                    type="datetime-local"
                    value={schedule.validFrom}
                    onChange={(e) =>
                      updatePriceSchedule(index, "validFrom", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    有効期間終了
                  </label>
                  <input
                    type="datetime-local"
                    value={schedule.validUntil}
                    onChange={(e) =>
                      updatePriceSchedule(index, "validUntil", e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-end">
                  {priceSchedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePriceSchedule(index)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.push("/admin/tickets")}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-indigo-300" : "bg-indigo-500 hover:bg-indigo-700"
              } text-white font-bold py-2 px-4 rounded`}
            >
              {loading ? "更新中..." : "更新する"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}