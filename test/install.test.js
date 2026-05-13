'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  expandHome,
  getWindowsPathExt,
  parseArgs,
  quoteWindowsCmdArg,
  requiresWindowsShell,
  resolveInputPath,
  stripWrappingQuotes,
} = require('../bin/install');

test('parseArgs supports target, version and yes flags', () => {
  assert.deepEqual(parseArgs(['--target', '~/aios', '--version=v1.1', '-y']), {
    target: '~/aios',
    version: 'v1.1',
    yes: true,
    help: false,
  });
});

test('stripWrappingQuotes removes matching shell quotes', () => {
  assert.equal(stripWrappingQuotes('"C:\\Users\\Rafael\\Projeto AIOS"'), 'C:\\Users\\Rafael\\Projeto AIOS');
  assert.equal(stripWrappingQuotes("'/Users/rafael/Projeto AIOS'"), '/Users/rafael/Projeto AIOS');
  assert.equal(stripWrappingQuotes('"unterminated'), '"unterminated');
});

test('expandHome supports Unix and Windows-style tilde paths', () => {
  assert.equal(expandHome('~/project', '/Users/rafael'), path.join('/Users/rafael', 'project'));
  assert.equal(expandHome('~\\project', 'C:\\Users\\Rafael'), path.join('C:\\Users\\Rafael', 'project'));
  assert.equal(expandHome('C:\\workspace\\aios', 'C:\\Users\\Rafael'), 'C:\\workspace\\aios');
});

test('resolveInputPath expands home after stripping quotes', () => {
  const resolved = resolveInputPath('"~/aiox project"');
  assert.equal(resolved, path.resolve(path.join(require('node:os').homedir(), 'aiox project')));
});

test('getWindowsPathExt keeps PATHEXT order and drops blanks', () => {
  assert.deepEqual(getWindowsPathExt({ PATHEXT: '.EXE;.CMD;;.BAT;' }), ['.EXE', '.CMD', '.BAT']);
});

test('Windows shell detection targets cmd and bat launchers only on Windows', () => {
  assert.equal(requiresWindowsShell('npm.cmd', 'win32'), true);
  assert.equal(requiresWindowsShell('script.BAT', 'win32'), true);
  assert.equal(requiresWindowsShell('gh.exe', 'win32'), false);
  assert.equal(requiresWindowsShell('npm.cmd', 'darwin'), false);
});

test('quoteWindowsCmdArg preserves simple args and quotes paths with spaces', () => {
  assert.equal(quoteWindowsCmdArg('install'), 'install');
  assert.equal(
    quoteWindowsCmdArg('C:\\Program Files\\nodejs\\npm.cmd'),
    '"C:\\Program Files\\nodejs\\npm.cmd"',
  );
});
