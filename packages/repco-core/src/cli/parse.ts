import pc from 'picocolors'
import { parseArgs } from '@pkgjs/parseargs'
import { commands } from './commands.js'
import { shortUsage } from './commands/help.js'

// helpers

export const sp = (i: number) => ' '.repeat(i)
export const print = (msg: string | string[], i = 0) => {
  msg = Array.isArray(msg) ? msg.join('') : msg
  console.log(sp(i) + msg)
}
export function cmdName (cmd: CommandSpec) {
  return cmd.prefix ? [cmd.prefix, cmd.name].join(' ') : cmd.name
}

// types

// a utility type that does not change a type but "simplifies" it into
// a record (if applicable)
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

// The magic for the arguments: Transforms (on the type level)
// [{ name: 'foo', required: true }, { name: 'bar', multiple: true }]
// into
// { foo: string, bar: string[] }
// @see https://stackoverflow.com/a/74363398/6883007
type TypedArguments<Args extends readonly ArgumentSpec[]> = Expand<{
  readonly [N in Args[number] as N['name']]: ExtractArgType<N>
}>

type ExtractArgType<T extends ArgumentSpec> = T['multiple'] extends true
  ? string[]
  : T['required'] extends true
  ? string
  : string | undefined

export interface ArgumentSpec {
  name: string
  required?: boolean
  multiple?: boolean
  help?: string
}

export type ArgumentConfig = ReadonlyArray<ArgumentSpec>

// an alternative version, as was suggested to me on the TypeScript Discord
// It uses a so-called UnionToIntersection type that ... works here.
// type U2I<U> = (U extends U ? (u: U) => 0 : never) extends (i: infer I) => 0
//   ? Extract<I, U>
//   : never
// type TypedArguments<Args extends readonly ArgumentSpec[]> = U2I<
//   {
//     readonly [N in keyof Args]: Record<Args[N]['name'], ExtractArgType<Args[N]>>
//   }[number]
// >

// The magic for the options. Here we just use the existing typings for this
// from the parseArgs function.
export type TypedOptions<T extends OptionsConfig> = ReturnType<
  typeof parseArgs<{ options: T }>
>['values']

export type ParsedOptions = ReturnType<typeof parseArgs>['values']

export interface OptionSpec {
  type: 'string' | 'boolean'
  short?: string
  multiple?: boolean
  help?: string
  default?: string | boolean
}

export interface OptionsConfig {
  [longOption: string]: OptionSpec
}

export type CommandBase = {
  name: string
  help?: string
}

export type CommandGroup = CommandBase & {
  commands: CommandSpec[]
}

export type CommandSpec = CommandBase & {
  options?: OptionsConfig
  arguments?: ArgumentConfig
  commands?: CommandSpec[]
  run?: (args: any, opts: any) => Promise<void>
  prefix?: string
}

export type Command<
  T extends OptionsConfig | undefined = OptionsConfig,
  U extends ArgumentConfig | undefined = ArgumentConfig,
> = CommandBase & {
  options?: T
  arguments?: U
  run: (
    opts: T extends OptionsConfig ? TypedOptions<T> : ParsedOptions,
    args: U extends ArgumentConfig ? TypedArguments<U> : string[],
  ) => Promise<void>
}

export function createCommand<
  T extends OptionsConfig | undefined,
  U extends ArgumentConfig | undefined,
>(command: Command<T, U>) {
  return command
}

export function createCommandGroup(group: CommandGroup) {
  return group as CommandSpec
}

// implementation

export class CliError extends Error {
  public command?: CommandSpec
  constructor(message: string) {
    super(message)
  }
}

export function assignPrefixes(commands: CommandSpec[]) {
  const ite = (cmd: CommandSpec) => {
    cmd.commands?.forEach((sub) => {
      sub.prefix = cmdName(cmd)
      ite(sub)
    })
  }
  commands.forEach(ite)
  return commands
}

export async function runAndPrintErrors(args?: string[]) {
  if (!args) args = process.argv.slice(2)
  try {
    await parseAndRun(args)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    print('')
    print(`${pc.red(pc.bold('error:'))} ${msg}`)
    print('')
    shortUsage((err as any).command as CommandSpec | undefined)
    if (process.env.DEBUG) {
      console.log(err)
    }
    process.exit(1)
  }
}

export async function parseAndRun(args: string[]) {
  // parse args a first time to find the correct subcommand.
  // the parse result will not be used later.
  const { values, positionals } = parseArgs({
    strict: false,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (!positionals.length) positionals.push('help')
  else if (values.help) positionals.unshift('help')

  let [command, removed] = findCommand(commands, positionals)
  // Go to help if subcommand was called
  if (command && command.commands) {
    const res = findCommand(commands, ['help'])
    command = res[0]
    removed = []
  }
  if (!command)
    throw new CliError(
      `The subcommand ${pc.bold(removed.join(' '))} wasn't found.`,
    )

  if (values.help) removed.push('-h', '--help')

  const remainingArgs = args.filter((x) => removed.indexOf(x) === -1)
  try {
    const config = {
      args: remainingArgs,
      allowPositionals: !!command.arguments,
      options: command.options,
    }
    // parse again, this time with the settings from the command
    const parsed = parseArgs(config)
    const positionals = parsePositionals(command.arguments, parsed.positionals)
    // it might be possible to type this statically, but I couldn't manage
    // and opted for returning a type-erased CommandSpec type from findCommand above.
    // Likely with flattening all command groups it could work, but maybe
    // it's also not worth it. The typings work within the commands,
    // so it's just the upstream parseArgs function plus the parsePositional
    // function in here that have to be checked manually so that
    // their respective invariants hold.
    // @ts-ignore
    await command.run(parsed.values, positionals)
  } catch (err) {
    ;(err as any).command = command
    throw err
  }
}

function parsePositionals<
  T extends ArgumentConfig,
  U extends T | undefined,
  R extends U extends T ? TypedArguments<T> : [],
>(conf: U, positionals: string[]): R {
  if (!conf) return positionals as R
  if (positionals.length && !conf.length) {
    throw new CliError(`Unexpected arguments: ${positionals.join(' ')}`)
  } else if (!conf || !conf.length) {
    return {} as R
  }

  const result: Record<string, string | string[] | undefined> = {}

  for (const spec of conf) {
    if (!spec.multiple) {
      const value = positionals.shift()
      if (!value && spec.required)
        throw new CliError(`Expected argument \`${spec.name.toUpperCase()}\``)
      result[spec.name] = value
    } else {
      const values = positionals
      if (!values.length && spec.required)
        throw new CliError(
          `Expected at least one argument \`${spec.name.toUpperCase()}\``,
        )
      result[spec.name] = values
    }
  }

  return result as R
}

export function findCommand(
  commands: CommandSpec[],
  positionals: string[],
): [CommandSpec | undefined, string[]] {
  let res
  let group = commands
  const removed: string[] = []
  while (positionals.length) {
    const arg = positionals.shift()
    if (arg) removed.push(arg)
    else break
    const command = group.find((x) => x.name === arg)
    if (command) res = command
    else break
    if (command.commands) group = command.commands
    else break
  }
  return [res, removed]
}
