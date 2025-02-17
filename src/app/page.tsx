"use client";

import Image from "next/image";
import { useState } from "react";

interface Event {
  id: number;
  title: string;
  date: string;
  price: string;
  isPurchased: boolean;
  theme: string;
  imageUrl: string;
}

const events: Event[] = [
  {
    id: 1,
    title: "Japan Coffee Festival 2025 in 滋賀県日野町",
    date: "2025/3/8-9",
    price: "当日券（¥1,800）",
    isPurchased: false,
    theme: "850年続く日野祭に華を添える16の曳山",
    imageUrl: "/hino.jpg"
  },
  {
    id: 2,
    title: "Japan Coffee Festival 2025 in 鳥取県倉吉市",
    date: "2025/3/22-23",
    price: "当日券（¥1,800）",
    isPurchased: false,
    theme: "花よりだんご",
    imageUrl: "/kurayoshi.png"
  },
];

export default function Home() {
  const [localEvents, setLocalEvents] = useState<Event[]>(events);

  const handlePurchase = (id: number) => {
    setLocalEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === id ? { ...event, isPurchased: true } : event
      )
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <Image
            className="mx-auto"
            src="/logo.png"
            alt="Japan Coffee Festival Logo"
            width={260}
            height={65}
            priority
          />
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {localEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white overflow-hidden shadow-lg rounded-lg"
              >
                <div className="p-6">
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900 mb-1">
                     {event.title}
                   </h3>
                   <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-3">
                     テーマ「{event.theme}」
                   </p>
                   <div className="relative w-full h-64 mb-4">
                     <Image
                       src={event.imageUrl}
                       alt={event.title}
                       fill
                       className="object-contain rounded-sm bg-gray-50"
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                    <p className="text-sm text-gray-600">開催日: {event.date}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {event.price}
                    </p>
                  </div>
                  <div className="mt-6 space-y-3">
                    {!event.isPurchased ? (
                      <button
                        onClick={() => handlePurchase(event.id)}
                        className="w-full text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors font-noto-serif font-medium"
                        style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
                      >
                        購入する
                      </button>
                    ) : (
                      <>
                        <button
                          disabled
                          className="w-full text-muted-foreground px-4 py-2 rounded-md cursor-not-allowed font-noto-serif font-medium"
                          style={{ background: 'linear-gradient(135deg, hsl(210, 40%, 96.1%), hsl(210, 40%, 94.1%))' }}
                        >
                          購入済み
                        </button>
                        <a href={`/ticket?event=${event.id}`}>
                          <button
                            className="w-full text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors font-noto-serif font-medium"
                            style={{ background: 'linear-gradient(135deg, hsl(173, 58%, 39%), hsl(173, 65%, 42%))' }}
                          >
                            チケット発行へ
                          </button>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
