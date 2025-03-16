"use client";

import Link from "next/link";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";

// TicketTypeテーブルから取得されるデータの型
type TicketType = {
  id: string;
  title: string;
  description: string;
  ticket_category: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
};

const STATUS_MAP = {
  available: { label: "販売中", className: "bg-green-100 text-green-800" },
  sold_out: { label: "売り切れ", className: "bg-yellow-100 text-yellow-800" },
  closed: { label: "販売終了", className: "bg-red-100 text-red-800" },
} as const;

export function TicketsClient({ 
  initialTickets 
}: { 
  initialTickets: TicketType[] 
}) {
  const [tickets, setTickets] = useState<TicketType[]>(initialTickets);
  const supabase = createClientComponentClient<Database>();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  // 現在は使用しないため、コメントアウト
  /*
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("TicketType")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;

      // ローカルの状態を更新
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ));

    } catch (error) {
      console.error("Status update error:", error);
      alert("ステータスの更新に失敗しました");
    }
  };
  */

  return (
    <div>
      <div className="mb-8 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">チケット管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            チケットの一覧表示、登録、編集を行うことができます
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/tickets/new"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            新規チケット登録
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      チケット名
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      カテゴリ
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      数量
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{ticket.title}</div>
                        <div className="text-gray-500">{ticket.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {ticket.ticket_category}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {ticket.quantity}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/tickets/${ticket.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          編集
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}