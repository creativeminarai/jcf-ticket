"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Shop = {
  id: string;
  shop_number: string;
  shop_name: string;
  coffee_name: string;
  greeting: string;
  roast_level: string;
  pr_url: string;
  destiny_ratio: number;
  ticket_count: number;
  image_url: string | null;
  notes: string;
};

export function ShopsClient({ initialShops }: { initialShops: Shop[] }) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClientComponentClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/shops/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("インポートに失敗しました");
      }

      // データを再取得
      const { data } = await supabase
        .from("shops")
        .select("*")
        .order("shop_number");
      
      if (data) {
        setShops(data);
      }

      alert("CSVのインポートが完了しました");
    } catch (error) {
      console.error("Import error:", error);
      alert("CSVのインポートに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">出店者管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            出店者の一覧表示、登録、編集を行うことができます
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className={`inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${
                isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isUploading ? "アップロード中..." : "CSVインポート"}
            </label>
          </div>
          <Link
            href="/admin/shops/new"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            新規出店者登録
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
                      店舗番号
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      出店者名
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      コーヒー名
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      焙煎度
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      チケット枚数
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">操作</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {shops.map((shop) => (
                    <tr key={shop.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {shop.shop_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          {shop.image_url && (
                            <div className="h-10 w-10 flex-shrink-0">
                              <Image
                                className="h-10 w-10 rounded-full"
                                src={shop.image_url}
                                alt=""
                                width={40}
                                height={40}
                              />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {shop.shop_name}
                            </div>
                            <div className="text-gray-500">{shop.greeting}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shop.coffee_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shop.roast_level}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shop.ticket_count}枚
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/shops/${shop.id}/edit`}
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