import { createContext, Dispatch, PropsWithChildren, useReducer } from 'react'

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
  private contexts: Map<string, React.Context<Context<any>>>

  private constructor() {
    this.contexts = new Map<string, any>()
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  public addContext<T>(name: string, initial: Context<T>) {
    const context = createContext(initial)
    this.contexts.set(name, context)
    const ContextProvider = ({ children }: PropsWithChildren) => {
      const hydrated = typeof window !== 'undefined'
      const [state, dispatch] = useReducer(
        this.reducer,
        { ...initial.state },
        (state) => {
          const persistedData = hydrated && window.localStorage.getItem(name)
          const items = persistedData ? JSON.parse(persistedData) : state.store
          const store =
            state.store instanceof Map
              ? new Map<string, Entity<T>>(Object.entries(items))
              : state.store instanceof Array
              ? [...items]
              : items
          return {
            ...state,
            store: store,
          }
        },
      )

      hydrated
        ? state.store instanceof Map
          ? window.localStorage.setItem(
              name,
              JSON.stringify(Object.fromEntries(state.store.entries())),
            )
          : window.localStorage.setItem(name, JSON.stringify(state.store))
        : null

      return (
        <context.Provider value={{ state, dispatch } as Context<T>}>
          {children}
        </context.Provider>
      )
    }

    return ContextProvider
  }

  public getContext<T>(name: string) {
    return this.contexts.get(name) as React.Context<Context<T>>
  }

  private reducer<T>(state: State<T>, action: Action<T>): State<T> {
    switch (action.type) {
      case 'CREATE':
        if (action.payload.id in state.store) {
          return { ...state, error: 'ID already exists' }
        }

      case 'UPDATE':
        let result = saveEntity(state.store, action.payload)
        return { ...state, ...result }

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
