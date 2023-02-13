---
title: CLI
weight: -1
---

# CLI

The repco command line interface (CLI) is the main tool for interacting with a repco instance. It is built with [TypeScript](https://www.typescriptlang.org).

## Installation

The CLI is included in the Docker image. If you are using the Docker image, you can access the CLI via `docker compose exec app repco`. If you are running the app locally, you can use `yarn cli`.

## Usage

First, let's understand the basic structure of a CLI command in Repco. The general format is:
```
repco <command> [opts] [args...]
```
Here, repco is the name of the CLI tool, command is the name of the specific command you want to run, opts are options that you can pass to the command, and args are arguments that you need to provide to the command.

For example, to run the version command, you can run:
```
yarn repco version
```

## Commands
To see the list of available commands in Repco, run:

``` 
yarn repco help
```

This will print a list of all the commands along with a brief description of what each command does.

To get more information about a specific command, run:

```
repco help <command>
```

Replace <command> with the name of the command you want to learn more about.