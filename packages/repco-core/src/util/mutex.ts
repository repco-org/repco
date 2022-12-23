export type ReleaseFn = () => void

const noop = () => {}

export class Mutex {
  queue: ReleaseFn[] = []
  locked = false

  async lock(): Promise<ReleaseFn> {
    if (!this.locked) return noop
    await new Promise<void>((resolve) => {
      this.queue.push(resolve)
    })
    this.locked = true
    return () => {
      this.locked = false
      const next = this.queue.shift()
      if (next) next()
    }
  }
}
