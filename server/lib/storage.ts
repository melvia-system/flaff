import path from 'path'
import { createStorage } from "unstorage"
import fsDriver from "unstorage/drivers/fs-lite"

export const storagepath = path.join(process.cwd(), `${process.env.STORAGE_PATH || './storages/uploads'}`)
const storage = createStorage({
  driver: fsDriver({
    // base: process.env.STORAGE_PATH || './storages/uploads'
    base: storagepath
  })
})

export { storage }