import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
      },
    });

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Error creating venue:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}