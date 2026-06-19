#!/usr/bin/env node
/**
 * AIOX Cockpit Installer Wizard
 *
 * Usage:
 *   npx github:rafaelscosta/aiox-installer
 *   npx github:rafaelscosta/aiox-installer --target /path/to/aios-project
 *   npx github:rafaelscosta/aiox-installer --version v1.1.1-imersao
 *   npx github:rafaelscosta/aiox-installer --yes        (skip prompts)
 *   npx github:rafaelscosta/aiox-installer --verify     (run full release gate)
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');
const { spawnSync } = require('node:child_process');

const COCKPIT_REPO = 'AIOXsquad/aiox-cockpit-imersao';
const DEFAULT_VERSION = 'v1.1.1-imersao';

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(msg) { console.log(msg); }
function info(msg) { console.log(`${c.cyan}[aiox]${c.reset} ${msg}`); }
function ok(msg) { console.log(`${c.green}[aiox]${c.reset} ${msg}`); }
function warn(msg) { console.log(`${c.yellow}[aiox]${c.reset} ${msg}`); }
function err(msg) { console.error(`${c.red}[aiox]${c.reset} ${msg}`); }
function step(n, total, msg) { console.log(`\n${c.bold}${c.magenta}[${n}/${total}]${c.reset} ${c.bold}${msg}${c.reset}`); }

function isWindows(platform = process.platform) {
  return platform === 'win32';
}

function stripWrappingQuotes(value) {
  const text = String(value || '').trim();
  if (text.length >= 2) {
    const first = text[0];
    const last = text[text.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return text.slice(1, -1);
    }
  }
  return text;
}

function expandHome(inputPath, homeDir = os.homedir()) {
  const cleanPath = stripWrappingQuotes(inputPath);
  if (cleanPath === '~') return homeDir;
  if (cleanPath.startsWith('~/') || cleanPath.startsWith('~\\')) {
    return path.join(homeDir, cleanPath.slice(2));
  }
  return cleanPath;
}

function resolveInputPath(inputPath) {
  return path.resolve(expandHome(inputPath));
}

function getWindowsPathExt(env = process.env) {
  return String(env.PATHEXT || '.EXE;.CMD;.BAT;.COM')
    .split(';')
    .map((ext) => ext.trim())
    .filter(Boolean);
}

function firstWhereMatch(command) {
  const probe = spawnSync('where.exe', [command], {
    stdio: ['ignore', 'pipe', 'ignore'],
    encoding: 'utf8',
  });
  if (probe.status !== 0 || !probe.stdout) return null;
  return probe.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || null;
}

function findCommand(commandName) {
  if (isWindows()) {
    if (path.extname(commandName)) return firstWhereMatch(commandName);
    for (const ext of getWindowsPathExt()) {
      const match = firstWhereMatch(`${commandName}${ext}`);
      if (match) return match;
    }
    return firstWhereMatch(commandName);
  }

  const probe = spawnSync('which', [commandName], {
    stdio: ['ignore', 'pipe', 'ignore'],
    encoding: 'utf8',
  });
  if (probe.status !== 0 || !probe.stdout) return null;
  return probe.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || null;
}

function displayCommand(commandPath, fallbackName) {
  return commandPath || fallbackName;
}

function quoteWindowsCmdArg(value) {
  const text = String(value);
  if (text === '') return '""';
  if (!/[ \t&()^|<>"]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function requiresWindowsShell(commandPath, platform = process.platform) {
  return isWindows(platform) && /\.(cmd|bat)$/i.test(commandPath);
}

function spawnCommand(commandPath, args, opts = {}) {
  if (requiresWindowsShell(commandPath)) {
    const shell = process.env.ComSpec || 'cmd.exe';
    const commandLine = [commandPath, ...args].map(quoteWindowsCmdArg).join(' ');
    return spawnSync(shell, ['/d', '/s', '/c', commandLine], opts);
  }
  return spawnSync(commandPath, args, opts);
}

function runCapture(cmd, args, opts = {}) {
  const commandPath = findCommand(cmd);
  if (!commandPath) {
    throw new Error(`Command not found: ${cmd}`);
  }
  const r = spawnCommand(commandPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...opts,
  });
  if (r.error) {
    throw new Error(`Command failed to start: ${displayCommand(commandPath, cmd)} (${r.error.message})`);
  }
  if (r.signal) {
    throw new Error(`Command terminated by signal ${r.signal}: ${cmd} ${args.join(' ')}`);
  }
  if (r.status !== 0) {
    const details = [r.stdout, r.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`Command failed (exit ${r.status}): ${cmd} ${args.join(' ')}${details ? `\n${details}` : ''}`);
  }
  return r.stdout || '';
}

function parseArgs(argv) {
  const args = { target: null, version: null, yes: false, help: false, verify: false, smoke: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--yes' || a === '-y') args.yes = true;
    else if (a === '--verify') args.verify = true;
    else if (a === '--smoke') args.smoke = true;
    else if (a === '--target') args.target = argv[++i];
    else if (a.startsWith('--target=')) args.target = a.slice('--target='.length);
    else if (a === '--version') args.version = argv[++i];
    else if (a.startsWith('--version=')) args.version = a.slice('--version='.length);
  }
  return args;
}

function printHelp() {
  log(`${c.bold}AIOX Cockpit Installer${c.reset}

Usage:
  npx github:rafaelscosta/aiox-installer [options]

Options:
  --target <path>    AIOS project root (default: detected from CWD)
  --version <tag>    Cockpit version (default: ${DEFAULT_VERSION})
  --verify           Run full cockpit release validation after install
  --smoke            Run build + smoke validation after install
  --yes, -y          Skip confirmations
  --help, -h         Show this help

Requirements:
  - Node.js 18+
  - GitHub CLI authenticated (run 'gh auth login' once)
  - Bun 1+ (for the engine — installer will warn if missing)

Examples:
  cd ~/my-aios-project && npx github:rafaelscosta/aiox-installer
  npx github:rafaelscosta/aiox-installer --target ~/my-aios-project --yes
  npx github:rafaelscosta/aiox-installer --target ~/my-aios-project --yes --verify
`);
}

function ask(rl, question, defaultAnswer) {
  return new Promise((resolve) => {
    const suffix = defaultAnswer ? ` ${c.dim}(${defaultAnswer})${c.reset}` : '';
    rl.question(`${c.cyan}?${c.reset} ${question}${suffix}: `, (a) => {
      const trimmed = (a || '').trim();
      resolve(trimmed || defaultAnswer || '');
    });
  });
}

async function askYesNo(rl, question, defaultYes = true) {
  const def = defaultYes ? 'Y/n' : 'y/N';
  const a = (await ask(rl, question, def)).toLowerCase();
  if (a === 'y/n' || a === 'y' || a === 'yes' || a === 'sim' || a === 's') return true;
  if (a === '') return defaultYes;
  return ['y', 'yes', 'sim', 's'].includes(a);
}

function isAiosRoot(dir) {
  return fs.existsSync(path.join(dir, '.aiox-core'));
}

function findAiosRoot(startDir) {
  let dir = resolveInputPath(startDir);
  for (let i = 0; i < 12; i++) {
    if (isAiosRoot(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function commandExists(cmd) {
  return Boolean(findCommand(cmd));
}

function checkGhAuth() {
  const ghCommand = findCommand('gh');
  if (!ghCommand) {
    return { ok: false, reason: 'gh CLI not installed. See https://cli.github.com/' };
  }
  const r = spawnCommand(ghCommand, ['auth', 'status'], { stdio: 'pipe' });
  if (r.error) {
    return { ok: false, reason: `gh could not be executed: ${r.error.message}` };
  }
  if (r.status !== 0) {
    return { ok: false, reason: "gh not authenticated. Run 'gh auth login' first." };
  }
  return { ok: true };
}

function runInherit(cmd, args, opts = {}) {
  const commandPath = findCommand(cmd);
  if (!commandPath) {
    throw new Error(`Command not found: ${cmd}`);
  }
  const r = spawnCommand(commandPath, args, { stdio: 'inherit', ...opts });
  if (r.error) {
    throw new Error(`Command failed to start: ${displayCommand(commandPath, cmd)} (${r.error.message})`);
  }
  if (r.signal) {
    throw new Error(`Command terminated by signal ${r.signal}: ${cmd} ${args.join(' ')}`);
  }
  if (r.status !== 0) {
    throw new Error(`Command failed (exit ${r.status}): ${cmd} ${args.join(' ')}`);
  }
}

function getTrackedChangeSet(cwd) {
  const output = [
    runCapture('git', ['diff', '--name-only'], { cwd }),
    runCapture('git', ['diff', '--cached', '--name-only'], { cwd }),
  ].join('\n');

  return new Set(output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
}

function getGeneratedTrackedChanges(beforeChanges, afterChanges) {
  return [...afterChanges].filter((file) => !beforeChanges.has(file)).sort();
}

function restoreGeneratedTrackedChanges(cockpitDir, beforeChanges) {
  const afterChanges = getTrackedChangeSet(cockpitDir);
  const generatedChanges = getGeneratedTrackedChanges(beforeChanges, afterChanges);
  if (generatedChanges.length === 0) return [];

  runInherit('git', ['restore', '--worktree', '--staged', '--', ...generatedChanges], {
    cwd: cockpitDir,
  });
  ok(`Restored ${generatedChanges.length} generated tracked file(s) after install/validation`);
  return generatedChanges;
}

function copyEnvIfMissing(src, dst) {
  if (fs.existsSync(dst)) {
    warn(`  ${path.basename(dst)} already exists — skipping`);
    return false;
  }
  if (!fs.existsSync(src)) {
    warn(`  ${path.basename(src)} not found in repo — skipping ${path.basename(dst)}`);
    return false;
  }
  fs.copyFileSync(src, dst);
  ok(`  created ${path.basename(dst)} from ${path.basename(src)}`);
  return true;
}

function printNextSteps(cockpitDir) {
  log('');
  log(`${c.bold}Next steps:${c.reset}`);
  log(`  1. Edit credentials:`);
  log(`     ${c.dim}${path.join(cockpitDir, '.env.development')}${c.reset}`);
  log(`     ${c.dim}${path.join(cockpitDir, 'engine', '.env')}${c.reset}`);
  log(`  2. Start the cockpit:`);
  if (isWindows()) {
    log(`     ${c.cyan}Set-Location -LiteralPath "${cockpitDir}"${c.reset}`);
    log(`     ${c.cyan}npm run dev${c.reset}`);
  } else {
    log(`     ${c.cyan}cd ${cockpitDir} && npm run dev${c.reset}`);
  }
  log(`  3. Open the UI:`);
  log(`     ${c.cyan}http://localhost:5173${c.reset}`);
  log('');
  if (isWindows()) {
    log(`Port :4002 occupied? Override in PowerShell with:`);
    log(`     ${c.cyan}$env:ENGINE_PORT="4042"; npm run dev${c.reset}`);
  } else {
    log(`Port :4002 occupied? Override with ${c.cyan}ENGINE_PORT=4042 npm run dev${c.reset}.`);
  }
  log('');
}

function runOptionalVerification(cockpitDir, mode) {
  if (!mode) return;
  if (mode === 'verify') {
    info('Running full cockpit release validation...');
    runInherit('npm', ['run', 'validate:release'], { cwd: cockpitDir });
    ok('release validation passed');
    return;
  }

  info('Running cockpit build before smoke validation...');
  runInherit('npm', ['run', 'build'], { cwd: cockpitDir });
  info('Running cockpit smoke validation...');
  runInherit('npm', ['run', 'smoke'], { cwd: cockpitDir });
  ok('smoke validation passed');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); return 0; }

  log(`${c.bold}${c.magenta}╔══════════════════════════════════════════╗${c.reset}`);
  log(`${c.bold}${c.magenta}║${c.reset}  ${c.bold}AIOX Cockpit Installer${c.reset}                  ${c.bold}${c.magenta}║${c.reset}`);
  log(`${c.bold}${c.magenta}╚══════════════════════════════════════════╝${c.reset}`);

  const verificationMode = args.verify ? 'verify' : args.smoke ? 'smoke' : null;
  const TOTAL_STEPS = verificationMode ? 8 : 7;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let cleanedUp = false;
  const cleanup = () => { if (!cleanedUp) { rl.close(); cleanedUp = true; } };

  try {
    // Step 1: locate AIOS project
    step(1, TOTAL_STEPS, 'Locating AIOS project root');
    let aiosRoot = args.target ? resolveInputPath(args.target) : findAiosRoot(process.cwd());
    if (aiosRoot && !isAiosRoot(aiosRoot)) {
      err(`Provided --target does not contain .aiox-core/: ${aiosRoot}`);
      return 1;
    }
    if (!aiosRoot) {
      warn('No .aiox-core/ found walking up from current directory.');
      const inputPath = await ask(rl, 'Path to your AIOS project root');
      if (!inputPath) { err('No path provided. Aborting.'); return 1; }
      aiosRoot = resolveInputPath(inputPath);
      if (!isAiosRoot(aiosRoot)) {
        err(`No .aiox-core/ found at ${aiosRoot}. Aborting.`);
        return 1;
      }
    }
    ok(`AIOS project: ${aiosRoot}`);

    // Step 2: confirm with user
    step(2, TOTAL_STEPS, 'Confirming target');
    const cockpitDir = path.join(aiosRoot, 'apps', 'cockpit');
    const version = args.version || DEFAULT_VERSION;
    log(`  AIOS root:    ${c.bold}${aiosRoot}${c.reset}`);
    log(`  Install at:   ${c.bold}${cockpitDir}${c.reset}`);
    log(`  Cockpit repo: ${c.bold}${COCKPIT_REPO}${c.reset}`);
    log(`  Version:      ${c.bold}${version}${c.reset}`);
    if (verificationMode) {
      log(`  Verify mode:  ${c.bold}${verificationMode}${c.reset}`);
    }

    if (!args.yes) {
      const proceed = await askYesNo(rl, 'Proceed?', true);
      if (!proceed) { warn('Aborted by user.'); return 0; }
    }

    // Step 3: verify gh auth
    step(3, TOTAL_STEPS, 'Verifying GitHub CLI authentication');
    const gh = checkGhAuth();
    if (!gh.ok) {
      err(gh.reason);
      err('The cockpit repo is private. Authenticate with the GitHub account that has read access:');
      err('  gh auth login');
      return 1;
    }
    ok('gh CLI authenticated');
    if (isWindows()) {
      info('Windows detected — using PATHEXT-aware command resolution.');
    }

    // Step 4: clone (or update)
    step(4, TOTAL_STEPS, `Cloning ${COCKPIT_REPO} into apps/cockpit/`);
    fs.mkdirSync(path.join(aiosRoot, 'apps'), { recursive: true });

    if (fs.existsSync(cockpitDir)) {
      warn(`Directory already exists: ${cockpitDir}`);
      const update = args.yes ? true : await askYesNo(rl, `Fetch latest and checkout ${version}?`, true);
      if (!update) { warn('Skipping clone. You may need to update manually.'); }
      else {
        runInherit('git', ['fetch', '--all', '--tags'], { cwd: cockpitDir });
        runInherit('git', ['checkout', version], { cwd: cockpitDir });
        ok(`Checked out ${version}`);
      }
    } else {
      runInherit('gh', ['repo', 'clone', COCKPIT_REPO, cockpitDir]);
      try {
        runInherit('git', ['checkout', version], { cwd: cockpitDir });
        ok(`Checked out ${version}`);
      } catch (e) {
        warn(`Could not checkout ${version} (using default branch). Available tags:`);
        try { runInherit('git', ['tag', '-l'], { cwd: cockpitDir }); } catch {}
      }
    }

    const trackedChangesBeforeInstall = getTrackedChangeSet(cockpitDir);

    // Step 5: install dependencies
    step(5, TOTAL_STEPS, 'Installing dependencies');
    info('Running npm install (root)...');
    runInherit('npm', ['install'], { cwd: cockpitDir });
    ok('npm install done');

    if (commandExists('bun')) {
      info('Running bun install (engine)...');
      runInherit('bun', ['install'], { cwd: path.join(cockpitDir, 'engine') });
      ok('bun install done');
    } else {
      warn('Bun not found. Skipping engine deps.');
      warn('Install Bun from https://bun.sh, then run:');
      if (isWindows()) {
        warn(`  Set-Location -LiteralPath "${path.join(cockpitDir, 'engine')}"`);
        warn('  bun install');
      } else {
        warn(`  cd ${path.join(cockpitDir, 'engine')} && bun install`);
      }
    }

    // Step 6: setup .env files
    step(6, TOTAL_STEPS, 'Setting up .env files from examples');
    copyEnvIfMissing(
      path.join(cockpitDir, '.env.example'),
      path.join(cockpitDir, '.env.development')
    );
    copyEnvIfMissing(
      path.join(cockpitDir, 'engine', '.env.example'),
      path.join(cockpitDir, 'engine', '.env')
    );

    if (verificationMode) {
      step(7, TOTAL_STEPS, verificationMode === 'verify' ? 'Running release validation' : 'Running smoke validation');
      runOptionalVerification(cockpitDir, verificationMode);
    }

    restoreGeneratedTrackedChanges(cockpitDir, trackedChangesBeforeInstall);

    // Final step: done
    step(TOTAL_STEPS, TOTAL_STEPS, 'Done');
    ok(`Cockpit installed at: ${cockpitDir}`);
    printNextSteps(cockpitDir);
    return 0;
  } catch (e) {
    err(`Wizard failed: ${e.message}`);
    return 1;
  } finally {
    cleanup();
  }
}

if (require.main === module) {
  main().then((code) => process.exit(code || 0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = {
  COCKPIT_REPO,
  DEFAULT_VERSION,
  expandHome,
  findAiosRoot,
  getGeneratedTrackedChanges,
  getWindowsPathExt,
  isWindows,
  parseArgs,
  quoteWindowsCmdArg,
  requiresWindowsShell,
  resolveInputPath,
  stripWrappingQuotes,
};
