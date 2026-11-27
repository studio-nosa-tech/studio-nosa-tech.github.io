---
title: Release channels
description: The ZIGNOS stable / testing / unstable channels, and the diff display, confirmation, and integrity check of zpkg upgrade.
---

ZIGNOS is a rolling release. The HEAD of the recipe tree is the current release,
but changes do not need to reach every user at the same speed. M40 introduced
three channels: **stable / testing / unstable**.

| Channel | Purpose | Bundled |
|---|---|---|
| `stable` | Stable. The default | stage3 / images |
| `testing` | Validation for the next stable | Added by `zpkg sync` |
| `unstable` | Latest under development. May include breaking changes | Added by `zpkg sync` |

## Recipe tree structure

```
/usr/share/zignos/recipes/
├── stable/{core,main,desktop}
├── testing/{core,main,desktop}
└── unstable/{core,main,desktop}
```

When `ZPKG_REPOS` is not set, zpkg automatically searches `core` / `main` /
`desktop` of the selected channel. The flat `recipes/{core,main,desktop}` from
before M39 continues to work **as stable**.

stage3 and images bundle **only stable**. To use testing / unstable, fetch all
channels with `zpkg sync`. stage3's `/etc/zpkg/sync.conf` references the GitHub
recipe repository in git mode by default, compares the `.zpkg-git` commit with the
remote HEAD, and fetches only when there are changes.

```sh
zpkg sync
# To specify explicitly
zpkg sync --git --from https://github.com/studio-nosa-tech/zignos-recipes
```

The default repository is public, so it can be fetched unauthenticated. If it is private, a git credential helper or SSH key is required.

## Channel policy for the kernel and desktop (KDE)

ZIGNOS channels differ in character by the base kernel and the KDE desktop.
Changes are always validated in the order **Unstable → Testing → Stable** and
never flow backwards.

| Channel | Linux | KDE | Character |
|---|---|---|---|
| `stable` | **6.18.65 LTS** | Qt 6.8.5 LTS / KF6 6.18 / Plasma 6.4.6 / Gear 25.04.3 / Mesa 26.2.7 | Stable, long-term support |
| `testing` | **7.3.6 latest stable** | Qt 6.11.3 / KF6 6.32 / Plasma 6.8.3 / Gear 26.08.3 / Mesa 26.3.1 | Latest stable |
| `unstable` | **7.4-rc3 mainline** | Qt 6.11.3 / KF6 6.32 / Plasma 6.8.3 / Gear 26.11.80 beta / Mesa 26.3.1 | Adventurous |

- **Stable** pins the LTS versions of Linux and Qt, and keeps Plasma / Gear on validated stable series
- **Testing** adopts the latest stable versions of Linux / KDE (or equivalents)
- **Unstable** is even newer than Testing and includes RC / beta / mainline / git snapshots
- New features and new versions are promoted in the order Unstable → Testing → Stable
- Stable is an LTS branch, so rather than taking Testing's latest versions as-is,
  validated fixes are backported to the LTS
- `core/linux` and `desktop/` branch into different series per channel. Other
  `core/` / `main/` packages are shared in principle
- Switching between `stable ↔ unstable` is a large-scale update.
  Check the differences with `zpkg upgrade -p`

> Unstable's Qt 6.12 / KF6 6.33 / Plasma 6.9 will be migrated together after
> Plasma 6.9 is released, so for now it uses the same Qt 6.11.3 / KF6 6.32 /
> Plasma 6.8.3 as Testing. The Mesa main snapshot is also held at 26.3.1 because
> KWin crashed at `sp_find_cached_tile` with QEMU's softpipe
> (awaiting re-validation on real GPUs).

## Selecting a channel

The configuration is in `/etc/zpkg/make.conf`.

```ini
# /etc/zpkg/make.conf
CHANNEL=stable
CFLAGS="-O2 -pipe"
MAKEOPTS="-j8"
```

Priority:

1. `ZPKG_CHANNEL` environment variable (one run only)
2. `zpkg upgrade --channel <ch>` (one run only)
3. `CHANNEL=` in `/etc/zpkg/make.conf`
4. The default, `stable`

To switch permanently:

```sh
zpkg channel                  # effective value, source, available channels
zpkg channel testing          # update make.conf (keep the other lines)
```

`zpkg channel testing` only writes the configuration; it does not change packages.
After switching, always check the differences before running.

```sh
zpkg upgrade -p               # check what will change
zpkg upgrade                  # run
```

If testing is not installed yet, commands that need the repo fail with
"channel testing is not installed ... run zpkg sync".

## Upgrade display

`zpkg upgrade` displays the following before running.

```
Channel: testing (/etc/zpkg/make.conf; last applied: stable)
These are the packages that will be upgraded, in order:
  [1] lib 1.0 -> 2.0
  [2] newlib 1.0 (new dependency)
  [3] app 1.0 -> 2.0
      deps: +newlib -oldlib
      warning: app 2.0 needs /etc/app.conf migration
  [4] glibc 1.0 -> 2.0
      warning: major version 1.0 -> 2.0
  [5] rebuild 1.0 (rebuild: USE flags changed)
No longer required (use --prune to remove):
  oldlib-1.0
Total: 3 upgrades, 1 new dependency, 1 rebuild, 3 orphans
```

- **Upgrades** — packages whose version increases
- **New dependencies** — packages newly required by the new recipe closure
- **Rebuilds** — packages whose effective USE flags changed under `--newuse`
- **Downgrades** — packages whose version decreases, such as after a channel switch
- **Dependency diffs** — `+added` / `-removed` / `~constraint changed`
- **Warnings** — the recipe's `upgrade_warning`, major version changes of key packages,
  new conflicts, slot changes, channel changes
- **Orphan packages** — packages (per slot) that were in the previous dependency
  closure (the closure traced from Meta.Depends at install time) and are no longer
  needed by the new closure. They are kept by default. Unrelated packages not in
  world are not targeted

## Confirmation and execution

- Normally `Proceed? [Y/n]`
- If downgrades are included and `--allow-downgrade` is absent, it shows
  `Downgrades are included. Continue? [y/N]` and you can cancel.
  With the flag, this confirmation is skipped
- `--yes` skips the normal confirmation (required for non-interactive runs)
- `-p` / `--pretend` only displays

## Build and recovery

upgrade first builds and installs the **newly required dependencies** (the plan's
`new dependency`), then **builds all** upgrade targets before installing them.
New dependencies are additions only and do not replace existing package versions.

1. If building a new dependency fails, existing packages are unchanged
2. If building an upgrade target fails, existing packages are not replaced
   (the newly installed dependencies remain. Since they are additions only, the
   existing system is not broken)
3. Installation is a per-package transaction. A failed package is rolled back,
   and earlier packages remain in a consistent state
4. After a failure, rerunning `zpkg upgrade` resumes from where it stopped
5. If interrupted by a power loss, etc., use `zpkg recover`

There is no feature to roll back the whole set in one transaction. This approach
prioritizes "not breaking the system with a broken build", and failures at the
install stage are rolled back per package. Installing new dependencies first is
so that packages requiring new makedepends can be built.

## Integrity check after an update

After installation, verify the following.

- World / targets are re-resolved in the selected channel, with no missing dependencies or conflicts
- DB records and manifests of the updated packages (and the whole closure)
  - Default: path existence, type (dir/link/file), symlink target, version
  - `--verify`: also compare the sha256 of every file

On success it prints `Integrity check OK (N packages, M files)` and records the
applied channel in `$ZPKG_DB/.channel`. On failure it lists the problematic paths
and exits non-zero.

## Orphan packages

By default they are only listed. With `--prune`, only orphan packages that no
other remaining package depends on are removed. Packages that are depended on are
shown as `kept: required by ...` and left in place. Orphans are detected per slot,
so another slot of the same name does not prevent pruning an unused slot.

## Operating rules (between channels)

- Promote changes in the order **unstable → testing → stable**
- binpkgs are matched by name / version / revision / effective USE flags plus the
  **channel and recipe digest**. Even with the same version, if the recipe contents
  differ, the cache is not used and the package is rebuilt. Even so, raise revision
  when you change the contents, for identification and distribution order
- Packages with the same version and recipe contents across channels are not
  reinstalled by `zpkg upgrade`. Even with the same version, if the recipe digest
  differs, they are rebuilt as `KindRebuild`
- Write `upgrade_warning` in the recipe for breaking changes. Major version changes
  of key packages (glibc/gcc/binutils/linux/openrc/initscripts/eudev/busybox/shadow/util-linux etc.)
  are warned about automatically

## Limitations

- `zpkg sync` replaces the entire tree. You can update a stable-only stage3 to a
  tarball with all channels, but there is no command to add or update just one
  channel
- Signing is per whole tree. The stable subtree bundled in stage3 remains unsigned
- Orphan detection is per slot and covers only packages included in the previous
  dependency closure
