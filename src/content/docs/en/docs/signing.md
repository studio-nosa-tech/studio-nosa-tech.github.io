---
title: Signing and verification
description: Verification of binpkg repositories and recipe trees in ZIGNOS with Ed25519 signatures, trusted keys, and rollback and expiry protection.
---

ZIGNOS verifies the integrity of distributed packages and recipes with
**Ed25519 detached signatures**. It does not depend on GPG or external
libraries; key generation, signing and verification all happen in the single
`zpkg` binary.

## What is protected

| Target | What is signed | What it protects |
|---|---|---|
| binpkg repository | The raw bytes of `index.json` | Tampering with package contents, manifests and version information |
| Recipe tree | `recipes.manifest` (sha256/size/mode of every file) | Tampering with recipes, build scripts and bundled patches |
| Rollback | `generation` and the last accepted state | Swapping in an older signed index/manifest |
| Expiry | `expires` | Reuse of a signature left unused for a long time |

A recipe's `checksums` are included in the manifest, so verification extends
from the **recipe tree signature to the source tarball sha256**.

## Key generation and management

```sh
# signing key pair (private key is 0600, existing files are not overwritten)
zpkg key generate --private ~/zignos-signing.key --public ~/zignos-signing.pub

# client: trust the public key
zpkg key import zignos-signing.pub
zpkg key list
```

- The key ID is the SHA-256 (64 hex) of the 32-byte Ed25519 public key
- Trusted keys live in `$ZPKG_ROOT/etc/zpkg/trusted.d/*.pub`
- There is no TOFU (automatic trust on first use). **Verify the public key
  fingerprint over a separate channel before importing**
- Do not place private keys inside repositories or recipe trees.
  `zpkg mkindex` and `zpkg sign-recipes` refuse when the private key is inside
  the target directory
- When rotating keys, import the new public key, sign with the new key, and
  finally remove the old key with `zpkg key remove <keyid>`

## Signing a binpkg repository

Recommended layout:

```text
binrepo/
├── index.json
├── index.json.sig
├── keys/<keyid>.pub
└── packages/
    ├── gcc.pkg.tar.gz
    ├── gcc.manifest
    └── gcc.meta.json
```

```sh
zpkg mkindex --key ~/zignos-signing.key \
  --generation 42 --expires 90d /srv/binrepo
```

- `index.json` is schema 2 and carries `generation` / `expires` / `keyid`
- `index.json.sig` is a signature over the raw bytes of `index.json`
- Each entry's `sha256` and `manifest_sha256` bind the binpkg payload and file
  list
- `keys/<keyid>.pub` is also written automatically. If you distribute it,
  publish this key's fingerprint over a separate channel (website, release
  notes, etc.)

If `--generation` is omitted, it becomes the existing `index.json` generation
+ 1. A new repository starts at 1. `--expires` accepts RFC3339 or `90d` /
`720h` (default +90 days).

## Signing a recipe tree

```sh
zpkg sign-recipes --key ~/zignos-signing.key \
  --generation 42 --expires 90d /path/to/zignos-recipes
```

`recipes.manifest` lists `path` / `sha256` / `size` / `mode` for every regular
file except `.git` and the signatures themselves. `recipes.manifest.sig` is a
signature over the raw bytes of that manifest.

`zpkg sync` verifies the following against the unpacked staging tree.

- The manifest signature and key ID
- Expiry and generation
- The sha256 / size of every file (and mode on Unix)
- That there are no extra files not listed in the manifest

The same verification runs for any input: a directory, a recipe tarball or a
stage3 tarball.

For channel trees (`stable/` / `testing/` / `unstable/`), the **entire tree**
is signed by one `recipes.manifest`. The distributed recipe tarball contains
all channels, so a single sync verifies every channel. stage3 bundles only the
stable subtree, which has no manifest of its own and is therefore still
treated as unsigned.

### Overlays

`zpkg overlay add` and `zpkg overlay sync` run the same `recipes.manifest`
verification on the fetched tree. Trusted keys, expiry, generation and the
sha256 of every file behave exactly as for the official tree.

Only the rollback record is kept per overlay: `$ZPKG_DB/.security.json` stores
the last accepted generation and SHA-256 under `overlay:<name>`, so generations
from one overlay never mix with another.

An unsigned overlay is accepted only with `--allow-unsigned` (for the official
ZIGNOS MENU, `overlay add zignos-menu` sets it automatically). A signature
that is present but invalid is rejected even with that setting. Overlay
authors can create a manifest and signature in the official format with
`zpkg sign-recipes`.

## Client-side verification

```sh
# register a trusted key
zpkg key import zignos-signing.pub

# update to a signed recipe tree
zpkg sync --from zignos-recipes.tar.xz

# use the binpkg repository
export ZPKG_BINREPO=https://example.com/zignos/binpkgs
zpkg install <pkg>
```

If verification fails, `install` and `sync` **stop with an error**. They never
silently fall back to a source build from a tampered repository.

### Rollback and expiry

The last accepted generation and SHA-256 are stored in
`$ZPKG_DB/.security.json`.

- A new generation smaller than the stored value → rejected as a rollback
- The same generation with different contents → rejected as a same-generation
  swap
- `expires` is in the past → rejected

### Explicit exceptions

| Setting | Meaning |
|---|---|
| `--allow-unsigned` / `ZPKG_ALLOW_UNSIGNED=1` | Allowed only when no signature **exists**. A broken signature is always rejected |
| `ZPKG_ALLOW_EXPIRED=1` | Only expiry is allowed. Signature and rollback verification remain |

The same settings can go in `/etc/zpkg/security.conf`.

```ini
TRUSTED_KEYS=/etc/zpkg/trusted.d
ALLOW_UNSIGNED=0
ALLOW_EXPIRED=0
```

## Current distribution status

The signing mechanism is implemented in zpkg, but the official signing key is
not yet in operation. The current stage3 / recipe tarballs are therefore
unsigned. When running `zpkg sync` on an unsigned distribution, specify the
exception explicitly.

```sh
zpkg sync --from zignos-recipes-....tar.xz --allow-unsigned
```

The official ZIGNOS MENU overlay is unsigned as well. `zpkg overlay add
zignos-menu` recognises the official name and records `ALLOW_UNSIGNED=1`, so
no extra option is needed.

Once the official key is generated and published, operation will move to
trusting it with `zpkg key import` and running without `--allow-unsigned`.
Keys can be generated with `zpkg key generate`.

## Limitations

- A leaked private key or a compromised root account cannot be prevented
- Key revocation lists (CRL) are not supported. Key rotation is used instead
- Initial trust depends on out-of-band fingerprint verification
- Secure Boot (GRUB/kernel signing) is a separate mechanism from package
  signing and is not supported
- GPG/OpenPGP is not supported. It will be added in the future by extending
  the signature envelope's `algorithm`
