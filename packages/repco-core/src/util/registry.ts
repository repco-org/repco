export interface PluginLike {
  definition: {
    uid: string
  }
}

export class Registry<T extends PluginLike> {
  private inner: Map<string, T> = new Map()

  get(uid: string): T | undefined {
    return this.inner.get(uid)
  }

  all(): T[] {
    return [...this.inner.values()]
  }

  ids(): string[] {
    return this.all().map(x => x.definition.uid)
  }

  has(uid: string): boolean {
    return !!this.inner.has(uid)
  }

  register(item: T) {
    const uid = item.definition.uid
    this.inner.set(uid, item)
    return item
  }

  filtered(fn: (p: T) => boolean): T[] {
    return [...this.inner.values()].filter(fn)
  }

  delete(item: T) {
    const uid = item.definition.uid
    this.inner.delete(uid)
  }
}
