import { File as FileModel, PrismaClient } from 'repco-prisma'
import { fetch } from 'undici'

export class File {
  url: URL
  static async fetch(prisma: PrismaClient, uid: string) {
    const record = await prisma.file.findFirst({ where: { uid } })
    if (!record) throw new Error('File not found')
    return new File(record)
  }

  constructor(public record: FileModel) {
    this.url = new URL(this.record.contentUrl)
  }

  async createReadStream() {
    const protocol = this.url.protocol.slice(0, -1)
    if (protocol === 'http' || protocol === 'https') {
      const res = await fetch(this.url)
      const stream = res.body
      return stream
    }
    throw new Error(`Unsupported protocol: ${protocol}`)
  }
}
