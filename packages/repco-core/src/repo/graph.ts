import { DequeSet } from '../util/collections.js'

export class GGraph {
  nodes: Record<string, string[]> = {}
  constructor() {}
  push(id: string, edges: string[]) {
    this.nodes[id] = edges
  }
  resolve(): string[] {
    const stack = new DequeSet<string>()
    const recurse = new DequeSet<string>()
    const insert = (id: string, edges: string[], depth = 0) => {
      if (stack.has(id)) return
      recurse.pushBack(id)
      for (const edge of edges) {
        if (!this.nodes[edge]) throw new Error('Missing: ' + edge)
        if (!stack.has(edge)) {
          if (recurse.has(edge)) {
            const path = recurse.from(edge)?.join('->')
            throw new Error(
              `Recursion: ${id}->${edge} is invalid because of ${path}`,
            )
          }
          insert(edge, this.nodes[edge], depth + 1)
        }
      }
      recurse.popFront()
      stack.pushBack(id)
    }
    for (const [id, edges] of Object.entries(this.nodes)) {
      insert(id, edges)
    }
    return stack.values()
  }
}
