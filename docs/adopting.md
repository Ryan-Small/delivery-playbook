# Adopting the playbook in a repository

## 1. Copy the controls

| Copy | Change |
|---|---|
| `.github/dependabot.yml` | Ecosystems and directories; keep the grouping and cooldown |
| `.github/workflows/tiered-automerge.yml` | The critical list |
| `.github/workflows/ci.yml` | The build and test commands; keep the three job names, they are the required checks |
| `.github/workflows/build-image.yml`, `promote.yml`, `deploy-dev.yml`, `release.yml` | The Dockerfile path and the smoke test |
| `.github/release.yml`, templates, `CODEOWNERS` | Owners and labels |
| `docs/procedure.md` | Reference it from the quality system; do not fork it per repository |

## 2. Repository settings

```text
gh repo edit OWNER/REPO --enable-auto-merge --enable-squash-merge \
  --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
gh api -X PUT repos/OWNER/REPO/vulnerability-alerts
gh api -X PUT repos/OWNER/REPO/automated-security-fixes
```

Dependency review is free on public repositories. On a private repository it needs GitHub Advanced Security; until then remove `dependency-review` from the required checks and record that gap.

## 3. Environments

Create `dev` with no reviewers, and `staging` and `production` with at least one required reviewer. The reviewer approval on the promotion job is the deployment authorization record.

```text
gh api -X PUT repos/OWNER/REPO/environments/dev
gh api -X PUT repos/OWNER/REPO/environments/staging \
  --input - <<< '{"reviewers":[{"type":"User","id":USER_ID}]}'
gh api -X PUT repos/OWNER/REPO/environments/production \
  --input - <<< '{"reviewers":[{"type":"User","id":USER_ID}]}'
```

## 4. Rulesets

Apply `docs/rulesets/branches.json` and `docs/rulesets/tags.json`. The branch ruleset covers the default branch and `release/*`; the tag ruleset makes `v*` tags immutable.

```text
gh api -X POST repos/OWNER/REPO/rulesets --input docs/rulesets/branches.json
gh api -X POST repos/OWNER/REPO/rulesets --input docs/rulesets/tags.json
```

Apply the rulesets after the first commit on `main`, because they forbid direct pushes.

## 4a. Single maintainer

GitHub never lets the account that opened a pull request approve it. With one maintainer, every pull request that is not Tier A would wait forever. Use `docs/rulesets/branches-single-maintainer.json` instead of `branches.json`: the one-approval rule stays, and the repository admin role may bypass it, for pull requests only. Direct pushes stay forbidden and the required checks still apply.

Every merge that uses the bypass is recorded on the pull request timeline as a rules bypass, so the exception is visible to anyone reading the record. Write the exception into the procedure, and remove the bypass actor as soon as a second maintainer exists.

```text
gh pr merge NUMBER --squash --delete-branch --admin
```

## 5. Baseline before you enable anything

Record, for the repository as it is today: open Dependabot alerts by severity and their median age, pull requests merged per week, and incidents attributed to dependency changes in the last quarter. Without these numbers no later claim of improvement can be checked.

## 6. Order of rollout

1. Alerts only, two weeks, baseline captured.
2. Full configuration on one repository, four weeks. Watch pull requests per week and the Tier A failure rate.
3. The rest of the repositories, one at a time.
