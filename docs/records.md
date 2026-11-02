# Records

Each control in this playbook produces a record where the work already happens. Nothing is filed twice.

| Requirement | Clause | Control | Record |
|---|---|---|---|
| Criteria for accepting externally provided products | ISO 9001 8.4.1, 8.4.2 | Tier table and critical list in the procedure; dependency review check | The procedure; the pull request check |
| Changes reviewed, authorised, verified, recorded | ISO 9001 8.5.6 | Ruleset: pull request, one approval, required checks | The pull request with its review, checks, and approval |
| Design change control | ISO 9001 8.3.6 | Same gate; issue linked from the pull request | The issue and the pull request |
| Retained documented information | ISO 9001 7.5.3 | GitHub retains pull requests, checks, releases, and deployments for the life of the repository | Periodic export if the quality system requires an offline copy |
| Nonconformity and corrective action | ISO 9001 10.2 | Bug template with severity; hotfix procedure | The issue, the two linked pull requests, the release |
| Monitoring and measurement | ISO 9001 9.1 | Monthly metrics in procedure section 8 | The monthly report |
| Management of technical vulnerabilities | ISO 27001 A 8.8 | Dependabot alerts; remediation timeline; security updates not delayed by cooldown | The alert, its linked pull request, the production deployment |
| Change management | ISO 27001 A 8.32 | Same gate for every change; promotion by digest with environment approvals | The pull request and the deployment approvals |
| Supplier relationships, ICT supply chain | ISO 27001 A 5.19, A 5.21 | Cooldown on fresh releases; SBOM on each release | The SBOM attached to the release |
| Vulnerability detection and remediation | SOC 2 CC7.1 | Dependabot alerts and timeline | As A 8.8 above |
| Change management | SOC 2 CC8.1 | As A 8.32 above | As A 8.32 above |
| Change notification to customers | Contract | Auto-generated release notes grouped by label | The GitHub Release page |

## What an auditor reads

For any production change: the GitHub Release lists the pull requests. Each pull request shows the diff, who approved and why, which checks ran and passed, and the issue it closes. The promotion job shows who approved the deployment and the smoke-test log proving the same digest moved. For a dependency update, the approval body names the tier and the procedure section that authorised it.
