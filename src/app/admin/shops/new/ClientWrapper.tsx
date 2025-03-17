"use client";

import dynamic from 'next/dynamic';
import type { Database } from "@/types/database.types";

// Event型を定義
type Event = Database['public']['Tables']['Event']['Row'] & {
  EventDate: Database['public']['Tables']['EventDate']['Row'][]
};

// クライアントコンポーネント内で動的インポートを行う
const NewShopClient = dynamic<{events: Event[]}>(() => import('@/app/admin/shops/new/NewShopClient'), {
  ssr: false,
});

export default function ClientWrapper({ events }: { events: Event[] }) {
  return <NewShopClient events={events} />;
}
