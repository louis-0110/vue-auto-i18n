/**
 * CLI Type Definitions
 */

export interface CLIOptions {
  config?: string
  output?: string
  verbose?: boolean
  include?: string[]
  exclude?: string[]
  languages?: string
  service?: string
  apiKey?: string
  incremental?: boolean
  force?: boolean
  dryRun?: boolean
  backup?: boolean
}

export interface CommandContext {
  options: CLIOptions
  config: any
  rootConfig: any
}

export interface CommandResult {
  success: boolean
  message?: string
  data?: any
}
