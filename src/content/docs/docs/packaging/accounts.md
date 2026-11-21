---
title: システムアカウント
description: ZIGNOS のベースアカウント、グループ、サービスユーザーの追加方法。
---

## ベースアカウント

`/etc/passwd` と `/etc/group` は管理者の所有物です。パッケージがファイルを
丸ごと置き換えると、後から追加したユーザーが消えます。

ZIGNOS では **initscripts** がベースアカウントを所有します。

- テンプレート: `/usr/share/zignos/base-accounts/passwd`, `group`
- `post_install` で不足しているエントリだけを追記
- 既存のユーザー・グループは変更しない

root、sshd、nobody、messagebus、tty、utmp、wheel、video、render、input、
audio、shadow などがベースに含まれます。

## グループ

| グループ | 用途 |
|---|---|
| `wheel` | 管理ユーザー(`doas` / `sudo`) |
| `video` | GPU / DRM |
| `render` | GPU レンダリング |
| `input` | 入力デバイス |
| `audio` | 音声 |
| `shadow` | `/etc/shadow` の限定読み取り |

デスクトップのユーザーは `video` / `render` に入れてください。

## サービスユーザー

サービスが専用ユーザーを必要とする場合、パッケージの `post_install` で
作成します。既に存在する場合は変更しません。

```sh
getent group foo >/dev/null || groupadd -r foo
getent passwd foo >/dev/null || \
  useradd -r -g foo -d /dev/null -s /usr/bin/false -c "Foo Daemon" foo
install -d -m700 -o foo -g foo "$ZPKG_ROOT/var/lib/foo"
```

代表例:

| ユーザー | 用途 |
|---|---|
| `messagebus` | D-Bus |
| `polkitd` | polkit |
| `chrony` | 時刻同期 |
| `sddm` | SDDM greeter |
| `plasmalogin` | Plasma Login Manager |

## 注意

- `useradd` / `groupadd` は対象 root のアカウントファイルを編集します。
  クロスインストールでは `ZPKG_ROOT` と chroot の扱いを確認してください
- `/etc/passwd` をパッケージに同梱しない
- 所有権は zpkg が保存しないため、`post_install` で `chown` する
- 既存ユーザーを削除・改名しない

設計の詳細は [システム設計](/docs/design-system/) を参照してください。
