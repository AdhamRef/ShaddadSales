import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ------------------------------------
  // 2) Create Agents
  // ------------------------------------
  const agentPassword = await bcrypt.hash("12345678", 10)

  const agentData = [
    { name: "Yomna", email: "yomna@example.com", password: agentPassword, role: Role.AGENT },
    { name: "Rahma", email: "rahma@example.com", password: agentPassword, role: Role.AGENT },
    { name: "Menna", email: "menna@example.com", password: agentPassword, role: Role.AGENT },
  ]

  const agents = []

  for (const data of agentData) {
    const created = await prisma.user.create({ data })
    agents.push(created)
  }

  console.log("Agents created:", agents)

  // ------------------------------------
  // 3) Create Cycle
  // ------------------------------------
  const cycle = await prisma.cycle.create({
    data: {
      name: "January Performance",
      month: 1,
      year: 2025,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      isActive: true,
    },
  })

  // ------------------------------------
  // 4) KPI Configuration
  // ------------------------------------
  await prisma.kPIConfiguration.create({
    data: {
      cycleId: cycle.id,
      closingRateWeight: 0.40,
      callConversionWeight: 0.30,
      responseTimeWeight: 0.15,
      qualifiedLeadsWeight: 0.15,
      closingRateTarget: 0.15,
      maxClosingRate: 0.30,
      callConversionTarget: 0.70,
      qualifiedLeadsTarget: 0.75,
    },
  })

  // ------------------------------------
  // 5) Daily Inputs for Each Agent
  // ------------------------------------
  for (const agent of agents) {
    await prisma.dailyInput.create({
      data: {
        agentId: agent.id,
        cycleId: cycle.id,
        date: new Date("2025-01-05"),
        messagesReceived: Math.floor(Math.random() * 80) + 20,
        callsDone: Math.floor(Math.random() * 50) + 10,
        closings: Math.floor(Math.random() * 5),
        avgResponseTime: Math.random() * 3 + 1,
        notes: "Daily performance auto-generated",
      },
    })
  }

  // ------------------------------------
  // 6) Qualified Leads for Each Agent
  // ------------------------------------
  for (const agent of agents) {
    await prisma.qualifiedLead.create({
      data: {
        agentId: agent.id,
        cycleId: cycle.id,
        leadName: `Lead for ${agent.name}`,
        phoneNumber: "01000000000",
        facebookProfile: "https://facebook.com/example",
        dateCollected: new Date("2025-01-06"),
        status: "Qualified",
      },
    })
  }

  console.log("✨ Seeding completed successfully!")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
