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

## O que ele faz

1. **Detecta** seu projeto AIOS (procura por `.aiox-core/` subindo do CWD)
2. **Confirma** o caminho com você
3. **Verifica** que `gh` CLI está autenticado (necessário porque o repo do cockpit é privado)
4. **Cria** `apps/` se não existir
5. **Clona** `rafaelscosta/aiox-cockpit` em `apps/cockpit/`
6. **Faz checkout** da versão escolhida (default: `v1.0-imersao`)
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

> Se `gh` não estiver autenticado, o wizard explica o que fazer e aborta —
> nada é alterado no seu projeto.

## Opções

```bash
npx github:rafaelscosta/aiox-installer [options]
```

| Opção | Descrição |
|-------|-----------|
| `--target <path>` | Caminho explícito pro AIOS root (default: detectado do CWD) |
| `--version <tag>` | Versão do cockpit a instalar (default: `v1.0-imersao`) |
| `--yes`, `-y` | Pula confirmações (útil pra CI ou re-runs) |
| `--help`, `-h` | Mostra ajuda |

### Exemplos

```bash
# Auto-detecta projeto AIOS no CWD
cd ~/projetos/meu-aios && npx github:rafaelscosta/aiox-installer

# Especifica target e pula prompts
npx github:rafaelscosta/aiox-installer --target ~/projetos/meu-aios --yes

# Instala uma versão específica
npx github:rafaelscosta/aiox-installer --version v1.1
```

## Atualização

Para atualizar o cockpit pra uma versão nova:

```bash
cd ~/projetos/meu-aios
npx github:rafaelscosta/aiox-installer --version v1.1
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
rode manualmente:

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# depois
cd ~/projetos/meu-aios/apps/cockpit/engine && bun install
```

### `Permission denied` ao clonar

Você não tem acesso ao repo privado. Peça acesso ao titular da Imersão.

## Licença

MIT — este wizard é open-source. O cockpit que ele instala tem licença
proprietária separada (veja `LICENSE` no próprio repo do cockpit).
