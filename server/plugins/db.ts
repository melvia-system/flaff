import { prisma } from "@/server/lib/db"

export default defineNitroPlugin(async (nitroApp) => {
  console.log(`[nitro:db] connecting to database`)
  await prisma.$connect()
  console.log(`[nitro:db] connected to database`)
  console.log(`[nitro:db] ${await prisma.flaff.count()} flaffs found, ${await prisma.file.count()} files found`)
})