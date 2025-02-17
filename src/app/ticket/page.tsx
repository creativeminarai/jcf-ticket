"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

interface CoffeeHistory {
  storeName: string;
  coffeeName: string;
  ticketCount: number;
  exchangeDate: string;
  imageUrl: string;
}

interface HistoryGroup {
  date: string;
  histories: CoffeeHistory[];
}

const dummyHistories: HistoryGroup[] = [
  {
    date: "2025/02/17",
    histories: [
      {
        storeName: "ショッピングプラザコーヒー",
        coffeeName: "エチオピア",
        ticketCount: 1,
        exchangeDate: "15:30",
        imageUrl: "/sample_sp.jpg"
      }
    ]
  },
  {
    date: "2025/02/16",
    histories: [
      {
        storeName: "アカマツ珈琲",
        coffeeName: "点滴コーヒー",
        ticketCount: 2,
        exchangeDate: "14:20",
        imageUrl: "/sample_akamatsu.jpg"
      }
    ]
  }
];

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface Event {
  id: number;
  title: string;
  date: string;
  theme: string;
  imageUrl: string;
}

interface Shop {
  name: string;
  coffeeName: string;
  description: string;
  coffeeIntro: string;
  imageUrl: string;
}

const dummyShop: Shop = {
  name: "世界ふるまい珈琲協会",
  coffeeName: "いつかはあなたもふるまい珈琲",
  description: "",
  coffeeIntro: "珈琲に「空 性 」があればその楽しみも無限に広がりますね。",
  imageUrl: "/sample.jpg"
};

const events: Event[] = [
  {
    id: 1,
    title: "Japan Coffee Festival 2025 in 滋賀県日野町",
    date: "2025/3/8-9",
    theme: "850年続く日野祭に華を添える16の曳山",
    imageUrl: "/hino.jpg"
  },
  {
    id: 2,
    title: "Japan Coffee Festival 2025 in 鳥取県倉吉市",
    date: "2025/3/22-23",
    theme: "花よりだんご",
    imageUrl: "/kurayoshi.png"
  },
];

export default function TicketPage() {
  const searchParams = useSearchParams();
  const eventId = Number(searchParams.get('event'));
  const event = events.find(e => e.id === eventId) ?? events[0];
  
  const [isLoading, setIsLoading] = useState(false);
  const [issuedShop, setIssuedShop] = useState<Shop | null>(null);

  const handleIssueTicket = async () => {
    setIsLoading(true);
    // 実際のAPIコールをシミュレート
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIssuedShop(dummyShop);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="block">
            <Image
              className="mx-auto"
              src="/logo.png"
              alt="Japan Coffee Festival Logo"
              width={200}
              height={50}
              priority
            />
          </Link>
        </div>
      </header>

      <Suspense fallback={
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-8">
            {/* イベント情報 */}
            <section className="overflow-hidden p-6 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {event.title}
              </h2>
              <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-3">
                テーマ「{event.theme}」
              </p>
              <p className="text-gray-600">開催日: {event.date}</p>
            </section>

            {/* 運命のコーヒー */}
            <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">運命のコーヒー</h2>
              {!issuedShop ? (
                <>
                  <button
                    onClick={handleIssueTicket}
                    disabled={isLoading}
                    className="w-full text-white px-4 py-3 rounded-md hover:opacity-90 transition-colors font-medium relative"
                    style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        発行中...
                      </div>
                    ) : (
                      "チケット発行"
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-3 text-center">・使用する日に発券してください。</p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full aspect-square max-w-md mx-auto">
                    <Image
                      src={issuedShop.imageUrl}
                      alt={issuedShop.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, 384px"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{issuedShop.name}</h3>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">出品コーヒー</span>
                        <span className="text-gray-700">「{issuedShop.coffeeName}」</span>
                      </div>
                      <p className="text-gray-600 text-sm italic whitespace-pre-wrap">
                        {issuedShop.coffeeIntro}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* チケット枚数 */}
            <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">チケット枚数</h2>
              <div className="flex items-center justify-center space-x-4 mb-6">
                {[1, 2].map((ticket) => (
                  <div key={ticket} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <span className="text-2xl">🎫</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="w-full text-white px-4 py-3 rounded-md hover:opacity-90 transition-colors font-medium"
                style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
              >
                追加チケット購入
              </button>
            </section>

            {/* コーヒーの履歴 */}
            <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">コーヒーの履歴</h2>
              <div className="space-y-8">
                {dummyHistories.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    <h3 className="font-bold text-gray-900 mb-3">
                      {new Date(group.date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      （{new Date(group.date).toLocaleDateString('ja-JP', { weekday: 'narrow' })}）
                    </h3>
                    <div className="space-y-4">
                      {group.histories.map((history, historyIndex) => (
                        <div key={historyIndex} className="bg-gray-50 rounded-lg p-4 relative">
                          <div className="absolute top-4 right-4">
                            <span className="text-sm text-gray-500">{history.exchangeDate}</span>
                          </div>
                          <div className="flex gap-4">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={history.imageUrl}
                                alt={history.storeName}
                                fill
                                className="object-cover rounded-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="border-b border-gray-200 pb-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{history.storeName}</h3>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">出品コーヒー</span>
                                  <span className="text-gray-700">「{history.coffeeName}」</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">チケット枚数</span>
                                  <span className="text-gray-700">{history.ticketCount}枚</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </Suspense>
        <div className="px-4 py-6 sm:px-0 space-y-8">
          {/* イベント情報 */}
          <section className="overflow-hidden p-6 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {event.title}
            </h2>
            <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-3">
              テーマ「{event.theme}」
            </p>
            <p className="text-gray-600">開催日: {event.date}</p>
          </section>

          {/* 運命のコーヒー */}
          <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">運命のコーヒー</h2>
            {!issuedShop ? (
              <>
                <button
                  onClick={handleIssueTicket}
                  disabled={isLoading}
                  className="w-full text-white px-4 py-3 rounded-md hover:opacity-90 transition-colors font-medium relative"
                  style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      発行中...
                    </div>
                  ) : (
                    "チケット発行"
                  )}
                </button>
                <p className="text-sm text-gray-600 mt-3 text-center">・使用する日に発券してください。</p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  <Image
                    src={issuedShop.imageUrl}
                    alt={issuedShop.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{issuedShop.name}</h3>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">出品コーヒー</span>
                      <span className="text-gray-700">「{issuedShop.coffeeName}」</span>
                    </div>
                    <p className="text-gray-600 text-sm italic whitespace-pre-wrap">
                      {issuedShop.coffeeIntro}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* チケット枚数 */}
          <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">チケット枚数</h2>
            <div className="flex items-center justify-center space-x-4 mb-6">
              {[1, 2].map((ticket) => (
                <div key={ticket} className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-2xl">🎫</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="w-full text-white px-4 py-3 rounded-md hover:opacity-90 transition-colors font-medium"
              style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
            >
              追加チケット購入
            </button>
          </section>

          {/* コーヒーの履歴 */}
          <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">コーヒーの履歴</h2>
            <div className="space-y-8">
              {dummyHistories.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className="font-bold text-gray-900 mb-3">
                    {new Date(group.date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    （{new Date(group.date).toLocaleDateString('ja-JP', { weekday: 'narrow' })}）
                  </h3>
                  <div className="space-y-4">
                    {group.histories.map((history, historyIndex) => (
                      <div key={historyIndex} className="bg-gray-50 rounded-lg p-4 relative">
                        <div className="absolute top-4 right-4">
                          <span className="text-sm text-gray-500">{history.exchangeDate}</span>
                        </div>
                        <div className="flex gap-4">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image
                              src={history.imageUrl}
                              alt={history.storeName}
                              fill
                              className="object-cover rounded-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="border-b border-gray-200 pb-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{history.storeName}</h3>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">出品コーヒー</span>
                                <span className="text-gray-700">「{history.coffeeName}」</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">チケット枚数</span>
                                <span className="text-gray-700">{history.ticketCount}枚</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}