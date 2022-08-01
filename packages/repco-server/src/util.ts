
export async function * batchAsyncIterator<T>(iter: AsyncIterable<T>, batchSize: number): AsyncIterable<T[]> {
  let batch = []
  for await (const line of iter) {
    batch.push(line)
    if (batch.length === batchSize) {
      yield batch
      batch = []
    }
  }
  if (batch.length) yield batch
}

export async function * parseNdjsonLines<T = any> (body: AsyncIterable<Uint8Array>): AsyncIterable<T> {
  let buf = ''
  for await (const chunk of body) {
    buf += new TextDecoder().decode(chunk)
    const parts = buf.split('\n')
    const last = parts.pop()
    if (last === undefined) continue
    if (last !== '') buf = last
    else buf = ''
    for (const line of parts) {
      yield JSON.parse(line) as T
    }
  }
  if (buf.length) yield JSON.parse(buf) as T
}

