"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/stripe";
import Link from "next/link";
import Image from "next/image";

type Purchase = {
  id: string;
  eventId: string;
  eventName: string;
  quantity: number;
  purchaseDate: string;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchPurchases() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 購入履歴を取得
        const { data: purchasesData, error: purchasesError } = await supabaseBrowser
          .from("PurchaseHistory")
          .select("id, event_id, quantity, purchase_date")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("purchase_date", { ascending: false });

        if (purchasesError) {
          console.error("購入履歴の取得に失敗しました:", purchasesError);
          setLoading(false);
          return;
        }

        if (!purchasesData || purchasesData.length === 0) {
          setPurchases([]);
          setLoading(false);
          return;
        }

        // イベントIDの一覧を取得
        const eventIds = purchasesData.map(purchase => purchase.event_id);

        // イベント情報を取得
        const { data: eventsData, error: eventsError } = await supabaseBrowser
          .from("Event")
          .select("id, name")
          .in("id", eventIds);

        if (eventsError) {
          console.error("イベント情報の取得に失敗しました:", eventsError);
          setLoading(false);
          return;
        }

        // イベント情報をマッピング
        const eventMap = new Map();
        eventsData?.forEach(event => {
          eventMap.set(event.id, event.name);
        });

        // 購入履歴とイベント情報を結合
        const formattedPurchases = purchasesData.map(purchase => ({
          id: purchase.id,
          eventId: purchase.event_id,
          eventName: eventMap.get(purchase.event_id) || "不明なイベント",
          quantity: purchase.quantity,
          purchaseDate: new Date(purchase.purchase_date).toLocaleDateString("ja-JP"),
        }));

        setPurchases(formattedPurchases);
      } catch (error) {
        console.error("購入履歴の取得中にエラーが発生しました:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPurchases();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Image
                className=""
                src="/logo.png"
                alt="Japan Coffee Festival Logo"
                width={260}
                height={65}
                priority
              />
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">購入履歴</h1>

        {purchases.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600 mb-4">購入履歴がありません。</p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              イベント一覧へ戻る
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <li key={purchase.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {purchase.eventName}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          購入完了
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          枚数: {purchase.quantity}枚
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {purchase.purchaseDate}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Link
                          href={`/ticket?event=${purchase.eventId}`}
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          チケットを表示
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
} 