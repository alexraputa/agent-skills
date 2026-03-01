/**
 * Core lint logic for skills-lint.
 * Functions are exported so they can be tested with vitest.
 */

// ---------------------------------------------------------------------------
// Block-list: commands that are explicitly NOT permitted in skill files.
// These commands can cause irreversible harm to a user's system.
// Everything not on this list is implicitly allowed.
// ---------------------------------------------------------------------------
export const BLOCKED_COMMANDS: ReadonlyArray<string> = [
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
export const BLOCKED_PATTERNS: ReadonlyArray<{ cmd: string; re: RegExp }> =
  BLOCKED_COMMANDS.map((cmd) => ({
    cmd,
    // Matches:  rm ...  |  /bin/rm ...  |  ./rm ...  |  ../bin/rm ...
    re: new RegExp(
      `(?:^|[\\s|;&\`$(])(?:[./][\\w./]*/)?${cmd}(?=[\\s|;&\`$()><!]|$)`
    ),
  }))

export interface Violation {
  file: string
  line: number
  command: string
  content: string
}

/**
 * Scan a block of text line-by-line and return violations.
 * Comments (lines starting with #) are intentionally NOT skipped: skill files
 * should not contain dangerous command names even in comments, since the AI
 * may read and act on any text it encounters.
 * `lineOffset` is the 0-based line index of the first line in the parent file.
 */
export function scanLines(
  text: string,
  filePath: string,
  lineOffset: number
): Violation[] {
  const violations: Violation[] = []
  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip blank lines
    if (!trimmed) continue

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
export function extractBashBlocks(
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
