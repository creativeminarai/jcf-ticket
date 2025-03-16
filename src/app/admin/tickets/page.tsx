import { createClient } from "@/utils/supabase/server";
import { TicketsClient } from "./TicketsClient";
import type { Database } from "@/types/database.types";

// Next.js 15でcookies()関数が非同期になったため、nodejsランタイムを使用
export const runtime = 'nodejs';

export default async function TicketsPage() {
  const supabase = await createClient();

  // Supabaseからチケットデータを取得
  const { data: tickets, error } = await supabase
    .from("TicketType")
    .select("*")
    .order("id");

  if (error) {
    console.error("Error fetching tickets:", error.message);
    return <div>データの取得中にエラーが発生しました: {error.message}</div>;
  }

  return <TicketsClient initialTickets={tickets} />;
}