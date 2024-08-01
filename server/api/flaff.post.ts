import { v4, v7 } from 'uuid'
// import crypto from 'crypto'
import { prisma } from "@/server/lib/db"
import { faker } from '@faker-js/faker'

export default defineEventHandler(async () => {
  try {
    const generateUniqueToken = (length = 32) => {
      // const array = new Uint8Array(length)
      // crypto.randomFillSync(array)
      // const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
      const hex = v4()
      const uuid = v7()
      return {
        uuid,
        hex,
        result: `${uuid}-${hex}`,
      }
    }

    // genreate database
    const token = generateUniqueToken()
    const capitalize = (s: string) => {
      // capitalize each word
      return s.replace(/\b\w/g, l => l.toUpperCase())
    }
    const created = await prisma.flaff.create({
      data: {
        uuid: token.uuid,
        ownerLink: token.result,
        guestLink: token.uuid,
        title: capitalize(faker.animal.cat() + ` Flaffy ` + faker.color.human()),
      }
    })

    return {
      ok: true,
      message: 'flaff created',
      data: {
        ...created,
      }
    }
  } catch (error) {
    console.error(error)
    return {
      ok: false,
      message: 'failed to create flaff',
      data: null,
    }
  }
})