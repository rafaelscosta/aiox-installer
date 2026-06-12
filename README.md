# AIOX Cockpit Installer

Wizard CLI que instala o [AIOX Cockpit](https://github.com/rafaelscosta/aiox-cockpit)
dentro do seu projeto AIOS, automatizando clone, instalação de dependências e
setup de `.env`s.

## Uso

```bash
cd /caminho/do/seu-projeto-aios
npx github:rafaelscosta/aiox-installer
```

Isso é tudo. O wizard guia o resto.

### Windows / PowerShell

Use PowerShell e mantenha caminhos com espaços entre aspas:

```powershell
Set-Location -LiteralPath "C:\caminho\do\seu-projeto-aios"
npx github:rafaelscosta/aiox-installer
```

Também funciona passando o target explicitamente:

```powershell
npx github:rafaelscosta/aiox-installer --target "C:\caminho\do\seu-projeto-aios" --yes
```

## O que ele faz

1. **Detecta** seu projeto AIOS (procura por `.aiox-core/` subindo do CWD)
2. **Confirma** o caminho com você
3. **Verifica** que `gh` CLI está autenticado (necessário porque o repo do cockpit é privado)
4. **Cria** `apps/` se não existir
5. **Clona** `rafaelscosta/aiox-cockpit` em `apps/cockpit/`
6. **Faz checkout** da versão escolhida (default: `v1.0.5-imersao`)
7. **Instala** dependências (`npm install` + `bun install`)
8. **Cria** `.env.development` e `engine/.env` a partir dos `.env.example`
9. **Imprime** próximos passos

## Pré-requisitos

| Ferramenta | Por quê | Como instalar |
|-----------|---------|---------------|
| Node.js 18+ | Roda o wizard e o cockpit | https://nodejs.org/ |
| GitHub CLI (`gh`) | Acesso ao repo privado do cockpit | https://cli.github.com/ |
| `gh auth login` | Autenticação com GitHub | `gh auth login` |
| Bun 1+ | Engine do cockpit | https://bun.sh/ |

No Windows, reinicie o PowerShell depois de instalar Node, GitHub CLI ou Bun
para garantir que o `PATH` novo foi carregado.

> Se `gh` não estiver autenticado, o wizard explica o que fazer e aborta —
> nada é alterado no seu projeto.

## Opções

```bash
npx github:rafaelscosta/aiox-installer [options]
```

| Opção | Descrição |
|-------|-----------|
| `--target <path>` | Caminho explícito pro AIOS root (default: detectado do CWD) |
| `--version <tag>` | Versão do cockpit a instalar (default: `v1.0.5-imersao`) |
| `--yes`, `-y` | Pula confirmações (útil pra CI ou re-runs) |
| `--help`, `-h` | Mostra ajuda |

### Exemplos

```bash
# Auto-detecta projeto AIOS no CWD
cd ~/projetos/meu-aios && npx github:rafaelscosta/aiox-installer

# Especifica target e pula prompts
npx github:rafaelscosta/aiox-installer --target ~/projetos/meu-aios --yes

# Instala uma versão específica
npx github:rafaelscosta/aiox-installer --version v1.0.5-imersao
```

PowerShell:

```powershell
Set-Location -LiteralPath "C:\projetos\meu-aios"
npx github:rafaelscosta/aiox-installer

npx github:rafaelscosta/aiox-installer --target "C:\projetos\meu-aios" --yes
```

## Atualização

Para atualizar o cockpit pra uma versão nova:

```bash
cd ~/projetos/meu-aios
npx github:rafaelscosta/aiox-installer --version v1.0.5-imersao
```

Se `apps/cockpit/` já existir, o wizard pergunta se quer fazer `git fetch` +
`git checkout` da nova versão (preserva seu `.env`).

## Troubleshooting

### `No .aiox-core/ found walking up from current directory`

Você não está dentro de um projeto AIOS. Soluções:
- `cd` pro diretório do seu projeto AIOS antes de rodar o wizard
- Ou passe `--target /caminho/do/projeto-aios` explicitamente

### `gh not authenticated`

```bash
gh auth login
# Escolha GitHub.com → HTTPS → Login with web browser
```

Depois rode o wizard de novo.

### `Bun not found`

O wizard segue sem instalar deps da engine, mas avisa. Instale o Bun e
rode manualmente. No Windows, siga o instalador atual em https://bun.sh/ e
reinicie o PowerShell antes de testar `bun --version`.

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# depois
cd ~/projetos/meu-aios/apps/cockpit/engine && bun install
```

PowerShell:

```powershell
Set-Location -LiteralPath "C:\projetos\meu-aios\apps\cockpit\engine"
bun install
```

### Windows: `gh`, `npm` ou `bun` instalado, mas não detectado

Feche e abra o PowerShell. Se continuar falhando, confirme:

```powershell
gh --version
npm --version
bun --version
```

O wizard v1.0.4 resolve comandos pelo `PATHEXT` do Windows, então executáveis
como `npm.cmd` passam a ser detectados corretamente.

### `Permission denied` ao clonar

Você não tem acesso ao repo privado. Peça acesso ao titular da Imersão.

## Licença

MIT — este wizard é open-source. O cockpit que ele instala tem licença
proprietária separada (veja `LICENSE` no próprio repo do cockpit).
