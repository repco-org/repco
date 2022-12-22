import type { Dispatch, PropsWithChildren } from 'react'
import { createContext, useReducer } from 'react'

export type Context<T> = { state: State<T>; dispatch: Dispatch<Action<T>> }
type Action<T> = Create<T> | Delete<T> | Update<T> | Failure

export interface Entity<T> {
  id: string
  data: T
}

interface State<T> {
  store: Entity<T>[] | Map<string, T>
  error: string | null
}

interface Create<T> {
  type: 'CREATE'
  payload: Entity<T>
}

interface Delete<T> {
  type: 'DELETE'
  payload: Entity<T>
}

interface Update<T> {
  type: 'UPDATE'
  payload: Entity<T>
}

interface Failure {
  type: 'FAILURE'
  payload: string
}

function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x)
}

export class ContextManager {
  private static instance: ContextManager
  private listContexts: Map<string, React.Context<Context<any>>>
  private mapContexts: Map<string, React.Context<Context<any>>>

  private constructor() {
    this.listContexts = new Map<string, any>()
    this.mapContexts = new Map<string, any>()
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  public addListContext<T>(name: string) {
    const context = createContext({} as Context<T>)
    this.listContexts.set(name, context)
    const ContextProvider = ({ children }: PropsWithChildren) => {
      const hydrated = typeof window !== 'undefined'
      const [state, dispatch] = useReducer(
        createLocalStorageReducer(name),
        {
          store: [] as Entity<T>[],
          error: null,
        },
        (state) => {
          const persistedData = hydrated && window.localStorage.getItem(name)
          const items = persistedData ? JSON.parse(persistedData) : state.store
          const store = [...items]
          return {
            ...state,
            store: store,
          }
        },
      )

      return (
        <context.Provider value={{ state, dispatch } as Context<T>}>
          {children}
        </context.Provider>
      )
    }
    this.listContexts.set(name, context)
    return ContextProvider
  }

  public addMapContext<T>(name: string) {
    const context = createContext({} as Context<T>)
    this.mapContexts.set(name, context)
    const ContextProvider = ({ children }: PropsWithChildren) => {
      const [state, dispatch] = useReducer(
        createLocalStorageReducer(name),
        {
          store: new Map<string, T>(),
          error: null,
        },
        (state) => {
          const data =
            (Object.entries(getPersistentData(name) || {}) as [
              string,
              Entity<T>,
            ][]) || state.store
          const store = new Map<string, Entity<T>>(data)
          return {
            ...state,
            store: store,
          }
        },
      )

      return (
        <context.Provider value={{ state, dispatch } as Context<T>}>
          {children}
        </context.Provider>
      )
    }
    this.mapContexts.set(name, context)
    return ContextProvider
  }

  public getListContext<T>(name: string) {
    return this.listContexts.get(name) as React.Context<Context<T>>
  }

  public getMapContext<T>(name: string) {
    return this.mapContexts.get(name) as React.Context<Context<T>>
  }
}

function getPersistentData(name: string) {
  const hydrated = typeof window !== 'undefined'
  const persistedData = hydrated && window.localStorage.getItem(name)
  const items = persistedData && JSON.parse(persistedData)
  return items
}

function saveEntity<T>(
  store: Entity<T>[] | Map<string, T>,
  payload: Entity<T>,
) {
  if (store instanceof Map) {
    store.set(payload.id, payload.data)
  } else if (Array.isArray(store)) {
    store.push(payload)
  } else {
    return { error: new Error('Store is not a Map or Array').message }
  }
  return { store }
}

function createLocalStorageReducer<T>(name: string) {
  return (state: State<T>, action: Action<T>): State<T> => {
    const hydrated = typeof window !== 'undefined'
    const nextState = reducerInner(state, action)

    if (hydrated && nextState !== state) {
      state.store instanceof Map
        ? window.localStorage.setItem(
            name,
            JSON.stringify(Object.fromEntries(state.store.entries())),
          )
        : window.localStorage.setItem(name, JSON.stringify(state.store))
    }
    return nextState
  }
}

function reducerInner<T>(state: State<T>, action: Action<T>): State<T> {
  console.log(state.store, action)
  switch (action.type) {
    case 'CREATE': {
      if (state.store instanceof Map) {
        if (state.store.has(action.payload.id)) {
          return { ...state, error: 'ID already exists' }
        }
      } else if (Array.isArray(state.store)) {
        if (state.store.find((element) => element.id === action.payload.id)) {
          return { ...state, error: 'ID already exists' }
        }
      }

      const result = saveEntity(state.store, action.payload)
      return { ...state, ...result }
    }

    case 'UPDATE': {
      const result = saveEntity(state.store, action.payload)
      return { ...state, ...result }
    }

    case 'DELETE':
      if (state.store instanceof Map) {
        state.store.delete(action.payload.id)
      } else if (Array.isArray(state.store)) {
        state.store = state.store.filter((e) => e.id !== action.payload.id)
      }
      return { ...state }

    case 'FAILURE':
      return { ...state, error: action.payload }
    default:
      return assertNever(action)
  }
}
