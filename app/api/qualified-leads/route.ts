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

    const leads = await prisma.qualifiedLead.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { dateCollected: "desc" },
    })

    // Transform to include agentName for compatibility with frontend
    const transformedLeads = leads.map(lead => ({
      ...lead,
      agentName: lead.agent.name
    }))

    return NextResponse.json(transformedLeads)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch qualified leads" },
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

    if (currentUser.role !== "ADMIN" && currentUser.id !== data.agentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lead = await prisma.qualifiedLead.create({
      data: {
        cycleId: data.cycleId,
        agentId: data.agentId,
        leadName: data.leadName,
        phoneNumber: data.phoneNumber,
        facebookProfile: data.facebookProfile,
        dateCollected: new Date(data.dateCollected),
        status: data.status || "Qualified",
      },
      include: {
        agent: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ ...lead, agentName: lead.agent.name })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create qualified lead" },
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

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingLead = await prisma.qualifiedLead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (currentUser.role !== "ADMIN" && currentUser.id !== existingLead.agentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const lead = await prisma.qualifiedLead.update({
      where: { id },
      data: {
        leadName: data.leadName,
        phoneNumber: data.phoneNumber,
        facebookProfile: data.facebookProfile,
        dateCollected: data.dateCollected ? new Date(data.dateCollected) : undefined,
        status: data.status,
      },
      include: {
        agent: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ ...lead, agentName: lead.agent.name })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update qualified lead" },
      { status: 500 }
    )
  }
}
