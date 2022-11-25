export class MapList<T> {
  inner: Map<string, T[]> = new Map()
  constructor() {}
  push(key: string, value: T) {
    if (!this.inner.has(key)) this.inner.set(key, [value])
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    else this.inner.get(key)!.push(value)
  }
  get(key: string): T[] | undefined {
    return this.inner.get(key)
  }
  getOrEmpty(key: string): T[] {
    return this.get(key) || []
  }
  has(key: string): boolean {
    return this.inner.has(key)
  }
  delete(key: string) {
    this.inner.delete(key)
  }
}

export class DequeSet<T> {
  set: Set<T> = new Set()
  stack: T[] = []
  constructor() {}
  pushBack(x: T) {
    if (this.set.has(x)) return
    this.set.add(x)
    this.stack.push(x)
  }
  pushFront(x: T) {
    if (this.set.has(x)) return
    this.set.add(x)
    this.stack.unshift(x)
  }
  delete(x: T) {
    this.set.delete(x)
    this.stack = this.stack.filter((u) => u !== x)
  }
  popFront() {
    const v = this.stack.shift()
    if (v !== undefined) this.set.delete(v)
    return v
  }
  popBack() {
    const v = this.stack.pop()
    if (v !== undefined) this.set.delete(v)
    return v
  }
  has(x: T): boolean {
    return this.set.has(x)
  }
  values() {
    return [...this.stack]
  }
  from(x: T) {
    const idx = this.stack.findIndex((v) => x === v)
    if (idx !== -1) return this.stack.slice(idx)
  }
}

