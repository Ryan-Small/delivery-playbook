# Release and promotion

## Build once

A commit is built once. The image is pushed to the GitHub container registry tagged `sha-<short commit>`. Every later step points an environment at that digest. Nothing is rebuilt, because a second build is a second artifact and the thing validated in staging would not be the thing in production.

`build-image.yml` is a reusable workflow that enforces this: if an image for the commit already exists, it returns that digest; otherwise it builds and pushes once.

## Tags are pointers, not builds

| Event | What happens |
|---|---|
| Merge to `main` | Build once, point `dev` at the digest, smoke test |
| Push `vX.Y.Z-rcN` | Reuse the digest, point `staging` at it after a required reviewer approves, smoke test |
| Push `vX.Y.Z` | Refuse unless `staging` currently runs the digest; point `production` at it after a required reviewer approves; create the GitHub Release with generated notes and the SBOM |

The version name is therefore a label applied at promotion, not something baked into the artifact. The banner shows it from runtime configuration.

## Runtime configuration without a rebuild

The image contains two kinds of fact.

- Build-time facts, written into `build-info.json` during the build: commit and build time. The bundle never changes after that.
- Runtime facts, written into `config.json` when the container starts: environment and release. The nginx image runs `docker/40-app-config.sh` on every start, which reads two environment variables and writes the file.

The deploy job runs the promoted image with those variables set and prints both files. The log shows an identical `build-info.json` under a different `config.json`, which is the evidence that the same artifact was promoted.

## Cutting a release

```text
# main is at the commit you want to release
git tag -a v1.1.0-rc1 -m "Release candidate 1 for 1.1.0"
git push origin v1.1.0-rc1
# approve the staging deployment, validate in staging

git tag -a v1.1.0 -m "Release 1.1.0" v1.1.0-rc1^{}
git push origin v1.1.0
# approve the production deployment
```

The second tag points at the same commit as the candidate. If validation fails, fix on `main`, tag `-rc2`, and validate the new digest. Dependabot pull requests that merge after a candidate is tagged are not in that candidate; they ship in the next one.

## Rolling back

Rollback is the step that bounds the cost of an automated update that breaks something: production goes back to the previous artifact in minutes, and the fix happens afterwards without pressure. It is a promotion in reverse, run by hand.

**When.** A merged change, automated or not, has broken staging or production and the fix is not already in hand. Rolling back first and fixing second is the default; fixing forward is the exception, chosen when the fix is ready and smaller than the rollback.

**How.** A code owner runs the "Rollback" workflow from the Actions tab with three inputs: the environment, `staging` or `production`; the release or candidate tag to restore, for example `v0.1.0`; and the reason. The workflow:

1. Resolves the tag to its image digest in the registry.
2. Checks that the chosen environment has run that digest before, from the environment's deployment history. A rollback can only restore an artifact that already passed through the gate once. Anything new goes through a release.
3. Calls the same promote workflow a release uses, so the environment's required reviewer approves it, the `staging` or `production` registry tag moves back to the digest, and the smoke test prints the restored banner.
4. Opens a tracking issue, labelled `bug` and `hotfix`, assigned to whoever ran it, with the reason, the run, and the follow-up checklist.

`dev` is not a rollback target. It tracks `main`, so `dev` is changed by reverting on `main`.

**Afterwards.** The issue carries three steps: revert the breaking change on `main` or fix forward; if the change was a dependency update, add a dated `ignore` entry for the broken version so Dependabot does not propose it again; and if the change merged by automation, record it as a Tier A failure in the monthly measures. The issue closes when `main` is clean.

## Release notes and SBOM

`.github/release.yml` groups pull requests by label into security updates, fixes, features, and dependency updates. Dependabot applies the `dependencies` and `security` labels; the pull request template reminds people to label theirs. The release workflow attaches the repository's SBOM from the dependency graph. That release page is the change notification for customers and the release-content record for the quality system.
