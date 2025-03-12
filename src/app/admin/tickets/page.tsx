import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { TicketsClient } from "./TicketsClient";
import type { Database } from "@/types/database.types";

export default async function TicketsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

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