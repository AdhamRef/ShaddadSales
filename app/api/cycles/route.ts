import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cycles = await prisma.cycle.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(cycles)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cycles" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, month, year, startDate, endDate } = await request.json()

    const cycle = await prisma.cycle.create({
      data: {
        name,
        month,
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        kpiConfig: {
          create: {},
        },
      },
      include: { kpiConfig: true },
    })

    return NextResponse.json(cycle)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create cycle" },
      { status: 500 }
    )
  }
}
