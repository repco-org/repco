export function setStorage(name: string, value: string) {
  console.log('SET')
  const values = localStorage.getItem(name)
  const arr = values ? JSON.parse(values) : []
  arr.push(value)
  localStorage.setItem(name, JSON.stringify(arr))
}

export function getStorage(name: string) {
  console.log('get')
  const values = localStorage.getItem(name)
  const arr = values ? JSON.parse(values) : []
  return arr
}
