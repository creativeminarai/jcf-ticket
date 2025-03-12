import Link from "next/link";

export default function AdminPage() {
  const menuItems = [
    {
      title: "イベント管理",
      description: "イベントの登録・編集・一覧表示",
      href: "/admin/events",
    },
    {
      title: "出店者管理",
      description: "出店者の登録・編集・一覧表示",
      href: "/admin/shops",
    },
    {
      title: "チケット管理",
      description: "チケット種別と価格の管理",
      href: "/admin/tickets",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">管理メニュー</h1>
        <p className="mt-2 text-sm text-gray-700">
          各種マスターデータの管理を行うことができます
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg border border-gray-200 bg-white p-6 hover:border-gray-400 hover:shadow-sm"
          >
            <h2 className="text-lg font-medium text-gray-900">{item.title}</h2>
            <p className="mt-2 text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}