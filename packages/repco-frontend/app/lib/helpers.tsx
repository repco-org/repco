export function addToLocalStorageArray(name: string, value: string) {
  let existing: any = localStorage.getItem(name)
  existing = existing ? existing.split(',') : []
  existing.push(value)
  localStorage.setItem(name, existing.toString())
}

export function localStorageItemToArray(name: string) {
  let existing: any = localStorage.getItem(name)
  existing = existing ? existing.split(',') : []
  return existing
}
