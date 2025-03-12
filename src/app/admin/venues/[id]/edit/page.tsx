"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Venue {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

import React from 'react';

export default function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // paramsをReact.use()でアンラップ
  const unwrappedParams = React.use(params);
  const venueId = unwrappedParams.id;
  
  return <EditVenueContent venueId={venueId} />;
}

function EditVenueContent({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<Venue>({
    id: 0,
    name: "",
    address: "",
    created_at: "",
  });

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await fetch(`/api/admin/venues/${venueId}`);
        if (!response.ok) throw new Error("Venue fetch failed");
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error("Error loading venue:", error);
        router.push("/admin/venues");
      }
    };

    fetchVenue();
  }, [venueId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/admin/venues/${venueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Venue update failed");

      router.push("/admin/venues");
      router.refresh();
    } catch (error) {
      console.error("Error updating venue:", error);
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            開催場所編集
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              場所名
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700"
            >
              住所
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}