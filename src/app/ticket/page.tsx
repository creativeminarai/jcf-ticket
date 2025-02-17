"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from "react";
import { EventInfo } from '@/components/ticket/EventInfo';
import { DestinyCoffee } from '@/components/ticket/DestinyCoffee';
import { TicketCount } from '@/components/ticket/TicketCount';
import { CoffeeHistory } from '@/components/ticket/CoffeeHistory';
import { Event, Shop } from '@/types/ticket';

const dummyHistories = [
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
            <EventInfo event={event} />
            <DestinyCoffee
              issuedShop={issuedShop}
              isLoading={isLoading}
              onIssueTicket={handleIssueTicket}
            />
            <TicketCount />
            <CoffeeHistory histories={dummyHistories} />
          </div>
        </main>
      </Suspense>
    </div>
  );
}