# Translating the ZIGNOS site

The site is bilingual: Japanese is the default locale at `/`, English lives
under `/en/`. Starlight serves the docs and falls back to Japanese for pages
that have no English file yet.

## Where files go

| Content | Japanese (default) | English |
|---|---|---|
| Docs | `src/content/docs/docs/<path>.md` | `src/content/docs/en/docs/<path>.md` |
| Marketing pages | `src/pages/<name>.astro` | `src/pages/en/<name>.astro` |
| News pages | `src/pages/news/<slug>.astro` | `src/pages/en/news/<slug>.astro` |

English marketing pages must pass `lang="en"` to `PageLayout`.

## Rules

- Translate `title` and `description` in the frontmatter. Keep every other
  frontmatter key and value as-is.
- Keep `{{release}}`-style tokens exactly; they are replaced at build time.
- Localize internal links: `/docs/...` → `/en/docs/...`, and the same for
  `/download/`, `/news/...`, `/about/`, `/what-is-zignos/`. The site root `/`
  becomes `/en/`. Anchors (`#...`) stay unchanged.
- External links, commands, paths, package names, file names, versions and
  dates stay exactly as written.
- Images are shared. From `src/content/docs/en/docs/<path>.md`, refer to an
  image in `src/content/docs/docs/images/` as
  `../../docs/images/<file>`.
- Translate Japanese comments inside code blocks; never change the code itself.
- Keep tables, lists, callouts and their structure. Do not add or remove
  warnings, caveats or steps.
- Do not introduce references to other distributions. If the source already
  has one as a clarification, keep it only when dropping it would change the
  meaning.
- Headings use sentence case and no trailing period ("Current release",
  "Three channels").

## Glossary

| Japanese | English |
|---|---|
| ソースベース | source-based |
| ローリングリリース | rolling release |
| レシピ | recipe |
| チャンネル | channel |
| ビルド | build |
| binpkg | binpkg |
| スロット | slot |
| USE フラグ | USE flag |
| 依存 / 依存関係 | dependency / dependencies |
| ツールチェーン | toolchain |
| ブートストラップ | bootstrap |
| ベースシステム | base system |
| サービス | service |
| 署名 / 検証 | signing / verification |
| ビルド隔離 | build sandbox |
| 再現可能ビルド | reproducible build |
| ロールバック | rollback |
| カーネル | kernel |
| ブートローダー | bootloader |
| パッケージ | package |
| 設定 | configuration |
| 管理 | management |
| 概要 | overview |
| 哲学 | philosophy |
| コントリビュート | contributing |
| リファレンス | reference |
| ロードマップ | roadmap |
| 制限・未実装 | limitations |
| 権限昇格 | privilege escalation |
| 一般ユーザー | regular user |

## Style

Technical, direct, present tense. Prefer imperative for instructions
("Install the kernel with ..."). Use "you" sparingly. Keep paragraphs short,
as in the Japanese source. Do not pad the text or explain things the source
does not.
