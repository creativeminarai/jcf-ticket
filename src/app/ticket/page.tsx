"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from "react";
import { EventInfo } from '@/components/ticket/EventInfo';
import { DestinyCoffee } from '@/components/ticket/DestinyCoffee';
import { TicketCount } from '@/components/ticket/TicketCount';
import { CoffeeHistory } from '@/components/ticket/CoffeeHistory';
import { Event, EventDate, Shop } from '@/types/ticket';
import { supabaseBrowser } from "@/lib/supabase/client";

const dummyHistories = [
  {
    date: "2025/02/17",
    histories: [
      {
        storeName: "ショッピングプラザコーヒー",
        coffeeName: "エチオピア",
        ticketCount: 1,
        exchangeDate: "15:30",
        imageUrl: "/sample_sp.jpg",
        number: 5
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
        imageUrl: "/sample_akamatsu.jpg",
        number: 8
      }
    ]
  }
];

// コーヒーショップのデータ（くじ引きで選ばれる候補）
const coffeeShops: Shop[] = [
  {
    name: "世界ふるまい珈琲協会",
    coffeeName: "いつかはあなたもふるまい珈琲",
    description: "",
    coffeeIntro: "珈琲に「空 性 」があればその楽しみも無限に広がりますね。",
    imageUrl: "/sample.jpg",
    number: 1
  },
  {
    name: "アカマツ珈琲",
    coffeeName: "点滴コーヒー",
    description: "",
    coffeeIntro: "丁寧に淹れた一杯をお楽しみください。",
    imageUrl: "/sample_akamatsu.jpg",
    number: 2
  },
  {
    name: "ショッピングプラザコーヒー",
    coffeeName: "エチオピア",
    description: "",
    coffeeIntro: "バランスの取れた味わいと芳醇な香りが特徴です。",
    imageUrl: "/sample_sp.jpg",
    number: 3
  },
  {
    name: "山の上珈琲店",
    coffeeName: "ブルーマウンテン",
    description: "",
    coffeeIntro: "最高級の豆を使用した贅沢な一杯をどうぞ。",
    imageUrl: "/sample.jpg",
    number: 4
  },
  {
    name: "朝日珈琲",
    coffeeName: "モーニングブレンド",
    description: "",
    coffeeIntro: "爽やかな朝を迎えるのにぴったりの一杯です。",
    imageUrl: "/sample_akamatsu.jpg",
    number: 5
  }
];

// 注意: このダミーデータは新しいSupabase実装では使用しません
const dummyEvents = [
  {
    id: "1",
    name: "Japan Coffee Festival 2025 in 滋賀県日野町",
    theme: "850年続く日野祭に華を添える16の曳山",
    status: "published",
    image_url: "/hino.jpg",
    event_number: 1,
    prefecture: "滋賀県",
    city: "日野町",
    reception_location: "日野町文化センター",
    EventDate: [{ id: "1", date: "2025-03-08", time: "10:00〜16:00" }]
  },
  {
    id: "2",
    name: "Japan Coffee Festival 2025 in 鳥取県倉吉市",
    theme: "花よりだんご",
    status: "published",
    image_url: "/kurayoshi.png",
    event_number: 2,
    prefecture: "鳥取県",
    city: "倉吉市",
    reception_location: "倉吉市文化センター",
    EventDate: [{ id: "2", date: "2025-03-22", time: "10:00〜16:00" }]
  },
];

// クライアントコンポーネントとして分離
function TicketContent() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('event');
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [issuedShop, setIssuedShop] = useState<Shop | null>(null);
  const [ticketCount, setTicketCount] = useState(2); // デフォルトのチケット枚数

  // Supabaseからイベント情報を取得
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // イベント取得開始
        
        // Supabaseからイベントデータを取得
        // まず基本情報のクエリを実行
        const { data: eventsData, error } = await supabaseBrowser
          .from("Event")
          .select(`
            id,
            name,
            theme,
            status,
            image_url,
            event_number,
            EventVenue:event_venue_id(
              country,
              prefecture,
              city,
              reception_location
            )
          `)
          .eq(eventIdParam ? 'id' : 'status', eventIdParam || 'published')
          .order('event_number', { ascending: false })
          .limit(1);

        if (error) {
          console.error("イベントデータ取得エラー:", error);
          throw new Error(`イベントデータ取得エラー: ${error.message}`);
        }

        if (!eventsData || eventsData.length === 0) {
          // 取得したイベントデータがない場合
          throw new Error("イベントデータが見つかりません");
        }

        const eventData = eventsData[0];
        // イベント基本情報取得成功
        
        // 新しいスキーマではEventDateテーブルからevent_idで日付情報を取得
        const { data: eventDatesData, error: datesError } = await supabaseBrowser
          .from("EventDate")
          .select('id, date, time')
          .eq('event_id', eventData.id);
          
        if (datesError) {
          console.error('イベント日付取得エラー:', datesError);
        }
        
        const eventDates: EventDate[] = eventDatesData || [];
        
        // イベント日付情報を取得
        
        // EventVenueはネストされたオブジェクトとして取得される
        // 配列ではなくオブジェクトとして取得されるように型を指定
        type VenueType = {
          country?: string;
          prefecture?: string;
          city?: string;
          reception_location?: string;
        };
        
        const venue: VenueType = eventData.EventVenue as VenueType || {};
        
        const formattedEvent: Event = {
          id: eventData.id,
          name: eventData.name,
          theme: eventData.theme || null,
          status: eventData.status || 'published',
          image_url: eventData.image_url || null,
          event_number: eventData.event_number || null,
          country: venue.country || '',
          prefecture: venue.prefecture || '',
          city: venue.city || '',
          reception_location: venue.reception_location || '',
          EventDate: eventDates
        };

        setEvent(formattedEvent);
        setIsLoading(false);
      } catch (error) {
        console.error("イベントの取得に失敗しました:", error);
        
        // エラー発生時にはダミーデータを代替表示
        alert(`イベントデータ取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`); 
        setEvent(dummyEvents[0]);
        setIsLoading(false);
      }
    };

    fetchEventData();
  }, [eventIdParam]);

  const handleIssueTicket = async () => {
    setIsLoading(true);
    // 実際のAPIコールをシミュレート
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ランダムにコーヒーショップを選択
    const randomIndex = Math.floor(Math.random() * coffeeShops.length);
    setIssuedShop(coffeeShops[randomIndex]);
    
    setIsLoading(false);
  };

  const handlePurchaseTicket = () => {
    // ここに追加チケット購入のロジックを実装
    setTicketCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0 space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700">イベント情報が見つかりませんでした。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-8">
      <EventInfo event={event} />
      <DestinyCoffee
        issuedShop={issuedShop}
        isLoading={isLoading}
        onIssueTicket={handleIssueTicket}
      />
      <TicketCount count={ticketCount} onPurchase={handlePurchaseTicket} />
      <CoffeeHistory histories={dummyHistories} />
    </div>
  );
}

export default function TicketPage() {
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Suspense 
          fallback={
            <div className="px-4 py-6 sm:px-0 space-y-8">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          }
        >
          <TicketContent />
        </Suspense>
      </main>
    </div>
  );
}