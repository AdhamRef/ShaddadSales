import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get("cycleId")

    const where = cycleId ? { cycleId } : {}

    const inputs = await prisma.dailyInput.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { date: "desc" },
    })

    // Transform to include agentName for compatibility
    const transformedInputs = inputs.map(input => ({
      ...input,
      agentName: input.agent.name
    }))

    return NextResponse.json(transformedInputs)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch daily inputs" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can create daily inputs" }, { status: 403 })
    }

    const input = await prisma.dailyInput.create({
      data: {
        cycleId: data.cycleId,
        agentId: data.agentId,
        date: new Date(data.date),
        messagesReceived: data.messagesReceived,
        callsDone: data.callsDone,
        closings: data.closings,
        avgResponseTime: data.avgResponseTime,
        notes: data.notes,
      },
      include: {
        agent: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ ...input, agentName: input.agent.name })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create daily input" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, ...data } = await request.json()

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can update daily inputs" }, { status: 403 })
    }

    const input = await prisma.dailyInput.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        messagesReceived: data.messagesReceived,
        callsDone: data.callsDone,
        closings: data.closings,
        avgResponseTime: data.avgResponseTime,
        notes: data.notes,
      },
      include: {
        agent: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ ...input, agentName: input.agent.name })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update daily input" },
      { status: 500 }
    )
  }
}
