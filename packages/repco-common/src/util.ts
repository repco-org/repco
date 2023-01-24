export class UntilStopped {
  resolve!: () => void
  promise: Promise<void>
  stopped = false
  constructor() {
    this.promise = new Promise((resolve) => (this.resolve = resolve))
  }
  stop() {
    this.stopped = true
    this.resolve()
  }
  async race<T>(promise: Promise<T>) {
    await Promise.race([this.promise, promise])
  }

  async timeout(duration: number) {
    return this.race(new Promise((resolve) => setTimeout(resolve, duration)))
  }
}
