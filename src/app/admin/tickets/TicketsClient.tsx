"use client";

import Link from "next/link";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";

type TicketWithEvent = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  event_id: string;
  status: "available" | "sold_out" | "closed";
  created_at?: string;
  updated_at?: string;
  events: {
    name: string;
    status: "draft" | "published" | "closed";
  };
};

const STATUS_MAP = {
  available: { label: "販売中", className: "bg-green-100 text-green-800" },
  sold_out: { label: "売り切れ", className: "bg-yellow-100 text-yellow-800" },
  closed: { label: "販売終了", className: "bg-red-100 text-red-800" },
} as const;

export function TicketsClient({ 
  initialTickets 
}: { 
  initialTickets: TicketWithEvent[] 
}) {
  const [tickets, setTickets] = useState<TicketWithEvent[]>(initialTickets);
  const supabase = createClientComponentClient<Database>();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketWithEvent["status"]) => {
    try {
      const { error } = await supabase
        .from("tickets")
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
                      イベント
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      価格
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      数量
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      ステータス
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
                        <div className="font-medium text-gray-900">{ticket.name}</div>
                        <div className="text-gray-500">{ticket.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {ticket.events.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatPrice(ticket.price)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {ticket.quantity}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketWithEvent["status"])}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_MAP[ticket.status].className}`}
                        >
                          {Object.entries(STATUS_MAP).map(([value, { label }]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
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