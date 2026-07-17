# AIOX Dashboard Installer

Wizard CLI that installs the **[AIOX Dashboard](https://github.com/rafaelscosta/aiox-dashboard)**
into your AIOX/AIOS project (clone → deps → `.env` setup).

**Product name:** AIOX Dashboard (web SPA + engine)  
**Not:** native desktop **AIOX Cockpit** (`SynkraAI/aiox-cockpit`)

## Usage

```bash
cd /path/to/your-aiox-project
npx -y github:rafaelscosta/aiox-installer
```

### Windows / PowerShell

```powershell
Set-Location -LiteralPath "C:\path\to\your-aiox-project"
npx -y github:rafaelscosta/aiox-installer
```

## What it does

1. Detects your AIOX project (walks up for `.aiox-core/`)
2. Confirms the install path
3. Verifies `gh` CLI auth (repo may be private)
4. Creates `apps/` if needed
5. Clones `rafaelscosta/aiox-dashboard` into `apps/cockpit/` (legacy folder name)
6. Checks out the release tag (default: **`v1.0.1-public`** — S0 + minimal-host boot fix)
7. Runs `npm install` + `bun install`
8. Creates `.env.development` and `engine/.env` from examples
9. Prints next steps

## Prerequisites

| Tool | Why |
|------|-----|
| Node.js 18+ | Wizard + UI |
| GitHub CLI (`gh`) + auth | Private repo access |
| Bun 1+ | Engine |

## Options

| Option | Description |
|--------|-------------|
| `--target <path>` | Explicit AIOX root |
| `--version <tag>` | Dashboard tag (default: `v1.0.1-public`) |
| `--verify` | Run `validate:release` after install |
| `--smoke` | Run `build` + `smoke` after install |
| `--yes`, `-y` | Non-interactive |

### Examples

```bash
npx -y github:rafaelscosta/aiox-installer --yes
npx -y github:rafaelscosta/aiox-installer --version v1.0.1-public --yes
npx -y github:rafaelscosta/aiox-installer --target ~/my-aiox --yes --smoke
```

## After install

```bash
cd apps/cockpit
# optional: export AIOX_PROJECT_ROOT=/path/to/aiox-project
npm run dev
```

Open http://127.0.0.1:5173

## Host contract

| Required | Optional |
|----------|----------|
| `.aiox-core/` | `docs/stories/` |
| `squads/` | `workspace/businesses/` |

Full AIOX scaffolds (e.g. aiox-enterprise) work best. Minimal hosts need a complete `.aiox-core` tree for all engine modules.

## License

MIT
