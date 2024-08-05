import path from 'path'
import { prisma } from "@/server/lib/db"
import { storage } from '@/server/lib/storage'

export default defineNitroPlugin(async (nitroApp) => {
  console.log(`[nitro:db] connecting to database`)
  await prisma.$connect()
  console.log(`[nitro:db] connected to database`)
  console.log(`[nitro:db] ${await prisma.flaff.count()} flaffs found, ${await prisma.file.count()} files found`)

  const storagepath = path.join(process.cwd(), `${process.env.STORAGE_PATH || './storages/uploads'}`)
  console.log(`[nitro:storage] load storages in path: ${storagepath}`)
})