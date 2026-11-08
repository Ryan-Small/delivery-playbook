# Adopting the playbook in a repository

## 1. Copy the controls

| Copy | Change |
|---|---|
| `.github/dependabot.yml` | Ecosystems and directories; keep the two security groups, the routine grouping, and the cooldown |
| `.github/workflows/tiered-automerge.yml` | The high-risk list |
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

One setting has no API and must be made in the browser: under the repository's Settings, Code security, Dependabot, enable the preset rule "Dismiss low impact issues for development-scoped dependencies". It dismisses development-only alerts whose advisory type cannot affect a built artifact, with the rule named as the dismissal reason. The dismissal is still a record, and GitHub reopens the alert if the dependency's scope changes. Without this rule, each such alert needs a person to dismiss it by hand under procedure section 5.

Dependency review is free on public repositories. On a private repository it needs GitHub Advanced Security; until then remove `dependency-review` from the required checks and record that gap.

## 2a. Labels

The release-notes configuration groups pull requests by label, and Dependabot applies the labels named in its configuration, but neither creates a label that does not exist. A new repository has none of them, so every pull request lands under "Other changes" until the labels exist. Create them once:

```text
gh label create dependencies   --repo OWNER/REPO --color 0366d6 --description "Dependency update (applied by Dependabot)"
gh label create security       --repo OWNER/REPO --color b60205 --description "Security update from a Dependabot alert"
gh label create hotfix         --repo OWNER/REPO --color d93f0b --description "Production fix shipped ahead of the next release"
gh label create skip-changelog --repo OWNER/REPO --color cccccc --description "Exclude from generated release notes"
```

The tier workflow applies `security` to security pull requests; Dependabot does not apply it by itself. `bug` and `enhancement` exist by default. The templates in `.github/ISSUE_TEMPLATE/` apply them to issues; the pull request template asks the author to carry the label onto the pull request.

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

## 7. Pin the actions

Every third-party action in `.github/workflows/` is referenced by the full commit SHA of a release, with the version tag as a trailing comment:

```text
uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

A tag can be moved to different code after the fact; a commit cannot. Dependabot's GitHub Actions updates keep both the SHA and the comment current, so pinning adds no manual work. The tier workflow itself is pinned the same way, because it is the control.

To resolve a tag to its commit: `gh api repos/OWNER/ACTION/commits/TAG --jq .sha`.
