"use client";

import dynamic from 'next/dynamic';
import type { Event } from "@/types/database.types";

// クライアントコンポーネント内で動的インポートを行う
const NewShopClient = dynamic<{events: Event[]}>(() => import('@/app/admin/shops/new/NewShopClient'), {
  ssr: false,
});

export default function ClientWrapper({ events }: { events: Event[] }) {
  return <NewShopClient events={events} />;
}
