# Publishing to GitHub

This repository lives at <https://github.com/asake-87/dsh-plugins>.

## Everyday push

The GitHub token is stored as the user environment variable `GITHUB_TOKEN`, so
it never appears in this repository, in `git config`, or on a command line:

```powershell
$env:PATH = "$env:TEMP\pgit\git\cmd;$env:PATH"   # only if git is not installed system-wide
$repo = "path\to\dsh-plugins"
$basic = [Convert]::ToBase64String(
  [Text.Encoding]::ASCII.GetBytes("x-access-token:$env:GITHUB_TOKEN"))
git -C $repo -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $basic" push origin main
```

The header applies to that single invocation only; git does not persist it.

## Why an inline header instead of a credential helper

A configured `credential.helper` makes git wait for interactive input when no
terminal can answer, which hangs automated runs. Passing the header per command
keeps pushes non-interactive and leaves nothing behind on disk.

## If the token expires

1. Generate a new fine-grained token at
   <https://github.com/settings/personal-access-tokens/new>
   with **Contents: Read and write** (add **Administration: Read and write** if
   the agent must also create repositories).
2. Update the variable:
   ```powershell
   [Environment]::SetEnvironmentVariable('GITHUB_TOKEN', '<new token>', 'User')
   ```
3. Restart DSH so the Host process inherits the new value.

## Alternative: publish.cmd

`publish.cmd` creates the repository and pushes `main` from a clean checkout. It
reads `GITHUB_TOKEN` the same way and is useful when setting up the repo on a new
machine.
