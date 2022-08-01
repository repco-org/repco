export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
    T extends (...args: any) => Promise<infer R> ? R : any

export type ArrayElement<ArrayType extends readonly unknown[]> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;


