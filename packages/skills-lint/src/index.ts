#!/usr/bin/env node
/**
 * Lint skills files for disallowed shell commands.
 *
 * A curated block-list of dangerous shell commands is checked against:
 *   - Shell scripts (.sh) inside skills/
 *   - Bash/sh/shell code blocks in Markdown files (.md) inside skills/
 *
 * Any command on the block-list is considered "not allow-listed" and will
 * cause the lint to fail.  Add safe commands to ALLOWED_COMMANDS and keep
 * BLOCKED_COMMANDS to the truly dangerous ones.
 */

import { readFile, readdir, stat } from 'fs/promises'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILLS_DIR = join(__dirname, '../../..', 'skills')

// ---------------------------------------------------------------------------
// Block-list: commands that are explicitly NOT permitted in skill files.
// These commands can cause irreversible harm to a user's system.
// Everything not on this list is implicitly allowed.
// ---------------------------------------------------------------------------
const BLOCKED_COMMANDS: ReadonlyArray<string> = [
  'rm',        // Deletes files — can cause permanent data loss
  'sudo',      // Privilege escalation — runs commands as root
  'chmod',     // Alters file permissions
  'chown',     // Alters file ownership
  'dd',        // Direct disk access — can overwrite drives
  'mkfs',      // Creates filesystems — destroys existing data
  'fdisk',     // Partition editor
  'gdisk',     // Partition editor
  'parted',    // Partition editor
  'kill',      // Terminates arbitrary processes
  'killall',   // Terminates processes by name
  'pkill',     // Terminates processes by pattern
  'eval',      // Executes arbitrary code from a string
  'passwd',    // Changes system passwords
  'useradd',   // Creates system users
  'userdel',   // Deletes system users
  'usermod',   // Modifies system users
  'groupadd',  // Creates system groups
  'crontab',   // Modifies scheduled tasks
  'reboot',    // Reboots the system
  'shutdown',  // Shuts down the system
  'halt',      // Halts the system
  'poweroff',  // Powers off the system
  'mount',     // Mounts filesystems
  'umount',    // Unmounts filesystems
  'iptables',  // Modifies firewall rules
  'nftables',  // Modifies firewall rules
  'ufw',       // Modifies firewall rules
]

// Pre-compile one regex per blocked command.
// Matches the bare command name OR a path-prefixed form (e.g. /bin/rm, ./rm).
// The lookahead ensures we match whole words, not substrings like "framework".
const BLOCKED_PATTERNS = BLOCKED_COMMANDS.map((cmd) => ({
  cmd,
  // Matches:  rm ...  |  /bin/rm ...  |  ./rm ...  |  ../bin/rm ...
  re: new RegExp(
    `(?:^|[\\s|;&\`$(])(?:[./][\\w./]*/)?${cmd}(?=[\\s|;&\`$()><!]|$)`
  ),
}))

interface Violation {
  file: string
  line: number
  command: string
  content: string
}

/**
 * Scan a block of text line-by-line and return violations.
 * Full-line comments (first non-whitespace char is #) are skipped.
 * Inline comments are intentionally NOT stripped: a skill file should not
 * contain dangerous command names even within comments, since Claude may read
 * and act on any text it encounters.
 * `lineOffset` is the 0-based line index of the first line in the parent file.
 */
function scanLines(
  text: string,
  filePath: string,
  lineOffset: number
): Violation[] {
  const violations: Violation[] = []
  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip blank lines and full-line comments
    if (!trimmed || trimmed.startsWith('#')) continue

    for (const { cmd, re } of BLOCKED_PATTERNS) {
      if (re.test(line)) {
        violations.push({
          file: filePath,
          line: lineOffset + i + 1,
          command: cmd,
          content: trimmed,
        })
        break // One violation per line is enough
      }
    }
  }

  return violations
}

/**
 * Extract all bash/sh/shell code block contents from a Markdown string.
 * Returns an array of { code, startLine } where startLine is the 0-based
 * index of the first line of code content within the parent file.
 */
function extractBashBlocks(
  markdown: string
): Array<{ code: string; startLine: number }> {
  const blocks: Array<{ code: string; startLine: number }> = []
  const lines = markdown.split('\n')
  let inBlock = false
  let blockLines: string[] = []
  let blockStart = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!inBlock) {
      if (/^```(bash|sh|shell)\s*$/i.test(line.trim())) {
        inBlock = true
        blockLines = []
        blockStart = i + 1 // content starts on next line (0-based)
      }
    } else {
      if (/^```\s*$/.test(line.trim())) {
        blocks.push({ code: blockLines.join('\n'), startLine: blockStart })
        inBlock = false
        blockLines = []
      } else {
        blockLines.push(line)
      }
    }
  }

  return blocks
}

/**
 * Recursively collect all files with the given extension under `dir`.
 */
async function findFiles(dir: string, ext: string): Promise<string[]> {
  const results: string[] = []
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return results
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    try {
      const info = await stat(full)
      if (info.isDirectory()) {
        results.push(...(await findFiles(full, ext)))
      } else if (entry.endsWith(ext)) {
        results.push(full)
      }
    } catch {
      // skip inaccessible entries
    }
  }
  return results
}

/**
 * Main entry point.
 */
async function main() {
  const violations: Violation[] = []

  // 1. Scan all .sh files in full
  const shFiles = await findFiles(SKILLS_DIR, '.sh')
  for (const file of shFiles) {
    const code = await readFile(file, 'utf-8')
    violations.push(...scanLines(code, file, 0))
  }

  // 2. Scan only bash/sh/shell code blocks inside .md files
  const mdFiles = await findFiles(SKILLS_DIR, '.md')
  for (const file of mdFiles) {
    const content = await readFile(file, 'utf-8')
    for (const { code, startLine } of extractBashBlocks(content)) {
      violations.push(...scanLines(code, file, startLine))
    }
  }

  const total = shFiles.length + mdFiles.length
  if (violations.length === 0) {
    console.log(`✓ Checked ${total} file(s) — no disallowed commands found.`)
    return
  }

  console.error(`\n✗ Found ${violations.length} disallowed command(s) in ${total} file(s) checked:\n`)
  for (const v of violations) {
    const rel = relative(join(SKILLS_DIR, '..'), v.file)
    console.error(`  ${rel}:${v.line}  [${v.command}]`)
    console.error(`    ${v.content}`)
  }
  console.error(
    '\nThe commands above are not permitted in skill files because they can\n' +
      'cause irreversible harm to a user\'s system.\n' +
      'See the BLOCKED_COMMANDS list in packages/skills-lint/src/index.ts.'
  )
  process.exit(1)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
