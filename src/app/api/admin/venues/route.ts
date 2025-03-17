import { NextRequest, NextResponse } from "next/server";

// Prismaクライアントを削除し、ダミーデータで置き換え
const dummyVenues = [
  {
    id: "1",
    name: "イベント会場1",
    address: "東京都渋谷区",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "イベント会場2",
    address: "神奈川県横浜市",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    // ダミーデータを返す
    return NextResponse.json(dummyVenues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    // 新しいダミーデータを作成
    const newVenue = {
      id: (dummyVenues.length + 1).toString(),
      name,
      address,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 実際の実装ではデータベースに保存しますが、ここではダミーデータとして返すだけ
    return NextResponse.json(newVenue);
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}