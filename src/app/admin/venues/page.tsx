"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Venue {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);

  const fetchVenues = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/venues");
      if (!response.ok) throw new Error("Venues fetch failed");
      const data = await response.json();
      setVenues(data);
    } catch (error) {
      console.error("Error loading venues:", error);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleDelete = async (id: number) => {
    if (!confirm("削除してもよろしいですか？")) return;

    try {
      const response = await fetch(`/api/admin/venues/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Venue deletion failed");
      fetchVenues();
    } catch (error) {
      console.error("Error deleting venue:", error);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">開催場所一覧</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/venues/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            新規作成
          </Link>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      場所名
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      住所
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {venues.map((venue) => (
                    <tr key={venue.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {venue.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {venue.address}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/venues/${venue.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => handleDelete(venue.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
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