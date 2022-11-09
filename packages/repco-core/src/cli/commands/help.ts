import pc from 'picocolors'
import { readFileSync } from 'fs'
import { commands } from '../commands.js'
import {
  ArgumentConfig,
  CliError,
  cmdName,
  CommandSpec,
  createCommand,
  findCommand,
  OptionsConfig,
  print,
  sp,
} from '../mod.js'

const hl = pc.underline
const orNoHelp = (help?: string) => help || pc.italic('no help text')
const printlns = (lines: (string | string[])[], ind = 0) =>
  lines.forEach((l) => print(l, ind))
const maxlength = (lines: string[]) =>
  lines.reduce((agg, cur) => Math.max(cur.length, agg), 0) + 2

const TEASER = pc.magenta('Replicate community media')
const NAME = 'repco'
const USAGE = [
  hl('Usage:'),
  pc.bold(NAME),
  pc.bold('<command>'),
  '[opts]',
  '[args...]',
].join(' ')

export function shortUsage(command?: CommandSpec) {
  if (command) print(commandUsage(command))
  else print(USAGE)
  print('')
  print(`For more information try ${pc.bold('--help')}`)
}

function readPackage() {
  const path = new URL('../../../../package.json', import.meta.url)
  const pkg = readFileSync(path).toString()
  return JSON.parse(pkg)
}

export const version = createCommand({
  name: 'version',
  async run() {
    const pkg = readPackage()
    print(pkg.version)
  },
})

export const help = createCommand({
  name: 'help',
  options: {
    all: {
      type: 'boolean',
      short: 'a',
      help: 'expand all commands and options',
    },
  } as const,
  arguments: [{ name: 'command', required: false, multiple: true }] as const,
  async run(opts, args) {
    if (args.command.length) {
      const [command, _] = findCommand(commands, args.command)
      if (!command) throw new CliError(`Command ${command} does not exist.`)
      printCommandHelp(command)
      return
    }

    printlns([TEASER, '', USAGE, ''])

    if (opts.all) {
      const cmds = commands.map((c) => pc.bold(c.name)).join(', ')
      print([hl('Commands:'), ' ', cmds])
      print('')
    } else {
      print(hl('Commands:'))
    }
    if (!opts.all) {
      // commands.sort(x => x.commands ? -1 : 1)
      printList(commands, true, 2)
    } else {
      for (const command of commands) {
        print(pc.bold(command.name), 2)
        if (command.help) print(command.help, 6)
        if ('options' in command && command.options) {
          printOptions(command.options, 6, false)
        }
        print('')
      }
    }
  },
})

function printList(commands: CommandSpec[], prefix = false, outerInd = 0) {
  const ind = maxlength(commands.map((c) => c.name))
  for (const command of commands) {
    if (command.commands) {
      print(command.help || command.name)
      printList(command.commands, prefix, outerInd)
      print('')
    } else {
      print(commandShortHelp(command, prefix, ind), outerInd)
    }
  }
}

function commandShortHelp(command: CommandSpec, prefix?: boolean, ind = 0) {
  const name = prefix ? cmdName(command) : command.name
  return [
    pc.bold(name),
    sp(Math.max(ind - name.length, 0) + 2),
    orNoHelp(command.help),
  ].join('')
}

function commandUsage(command: CommandSpec) {
  const cmdCall = commandCall(NAME, command)
  return `${hl('Usage:')} ${cmdCall}`
}

function printCommandHelp(command: CommandSpec) {
  print(orNoHelp(command.help))
  print('')
  print(commandUsage(command))
  print('')
  if (command.commands && command.commands.length) {
    print(hl('Subcommands:'))
    printList(command.commands as CommandSpec[], false, 4)
  }
  if (command.arguments && command.arguments.length) {
    print(hl('Arguments:'))
    printArguments(command.arguments, 2)
  }
  if (command.options && Object.keys(command.options).length) {
    print(hl('Options:'))
    printOptions(command.options, 2)
  }
}

function commandCall(prefix: string, command: CommandSpec) {
  const parts = [pc.bold(prefix + ' ' + cmdName(command))]
  if (command.options) parts.push('[opts]')
  if (command.arguments) {
    parts.push(
      ...command.arguments.map((arg) => {
        const name = arg.name.toUpperCase()
        return pc.italic(arg.required ? `<${name}>` : `[${name}]`)
      }),
    )
  }
  if (command.commands) {
    parts.push(pc.italic(`<subcommand>`))
  }
  return parts.join(' ')
}

function printArguments(args: ArgumentConfig, indent = 0) {
  const ind = maxlength(args.map((arg) => arg.name))
  for (const arg of args) {
    print(
      [pc.bold(arg.name), sp(ind - arg.name.length + 2), orNoHelp(arg.help)],
      indent,
    )
  }
}

function printOptions(options: OptionsConfig, indent = 0, bold = true) {
  const lines: [string, string?][] = []
  const b = bold ? pc.bold : (x: string) => x
  for (const [name, spec] of Object.entries(options)) {
    let opt = `--${name}`
    if (spec.short) opt += `, -${spec.short}`
    lines.push([opt, spec.help])
  }
  const ind = maxlength(lines.map((l) => l[0]))
  for (const [opt, help] of lines) {
    print(
      [b(opt), sp(ind - opt.length), help || pc.italic('no help text')],
      indent,
    )
  }
}
