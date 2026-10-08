# Implementation verification

## Passed as of October 8, 2026

- React/Vite/TypeScript production build, lint and backend type checks.
- 44 bilingual lessons, all 28 original code hashes, 18 document mappings and all
  offline exercise / validator ID mappings. Mappings alone do not prove execution.
- 31 unit/integration tests covering deduplicated XP, account isolation, reset epochs,
  local/cloud progress choice, failed-sync preservation and the isolated React preview.
  Added lab tests cover competing starts, account-wide ownership, logout during
  provisioning, failed termination, 30-minute idle and 90-minute absolute expiry,
  stale responses after logout, and SSM frame integrity / UTF-8.
- Seventeen desktop/mobile browser checks: clean routes, persisted guest progress, flag
  language switching, dark-mode contrast, persistent chrome, compact studio footer,
  full-width About with navbar entry, CI/CD path/downloads, legacy lab redirects, independently scrolling lesson/sidebar and mobile drawer
  fullscreen drawer bounds, icon-only trigger and focus/Escape behavior. Screenshots: screenshots/fixed-learning-workspace.jpg and
  screenshots/mobile-lab-drawer.jpg.
- Live S3 progression checks: stale ETag writes rejected, repeat saves award points
  once, users isolated, reset epochs reject old snapshots, unauthenticated calls fail.
- Actual temporary Cognito account (email suppressed), Amplify SRP sign-in, API
  Gateway JWT validation and S3 save/read/reset. Forged tokens and caller ownership
  rejected. Temporary account and object removed; no emails sent.
- Ten public frontend settings retrieved from SSM. GitHub main-only deployment
  environments and separate narrow OIDC roles configured.
- Earlier offline Docker Node/npm install, API tests and React build with networking
  disabled. This is separate from EC2 image and terminal acceptance.
- Temporary EC2 CloudFormation template validated by AWS.

## Executed EC2 acceptance

The user superseded the browser-WASM plan with temporary isolated EC2 labs and
confirmed one lab shared across all lessons in a learning path. The AWS image passed its offline bake checks and ami-0431b6741155b82d4 is
available. The temporary builder stack was removed. An initial Lambda concurrency
quota failure was resolved by replacing reserved concurrency with four durable S3
fleet slots. Conditional writes cap launches even when multiple users start at once;
slots remain occupied until EC2 teardown is confirmed. Unit checks cover competing
claims, retries and delayed release. Real isolated instances booted, registered with SSM and delivered a student shell prompt.
The client now handles empty AWS publication controls and agents that begin a
Standard_Stream without a handshake. Regression tests cover both observed behaviors.
Real-instance acceptance passed: Node 24 installation from the local APT repo,
offline npm installation, the starter API tests, React production build and the
observable introduction exercise validator. Cross-path starts returned 409. The
instance had no public IP, internet/peering route or inbound security-group rule.
Authenticated End terminated the shell and EC2 instance, and the encrypted root
volume was deleted. The same End endpoint is awaited by logout. All temporary
smoke accounts were removed and the active course-instance count returned to zero.
This is representative EC2 acceptance, not an exhaustive execution of every legacy
exercise. Idle/absolute deadlines and logout races are covered by lifecycle tests.
The real-account smoke script is
backend/service/scripts/smoke-labs.mjs. No WebAssembly release or LAB_RELEASE is needed.

Frontend publication and the GitHub Pages workflow source switch passed. Both
GitHub workflows succeeded for application commit 2fd85e7. The Pages build retrieved ten public
SSM settings before Vite compiled the artifact. Production checks passed at
https://linux.jcampos.dev for language/theme round trips, deep links, the CI/CD
path, account registration form and Cognito hosted sign-in configuration.

The subsequent user request enables branded email for explicit verified SES email
identities only. Backend and email sources are now independent private repositories;
see repositories.md. Current wiring and verification are recorded there.

## Sequential motion

Language, theme and page navigation now cover outgoing content before committing
the change, then reveal the new content. Browser checks assert the outgoing language
and theme remain during exit, the change occurs under a fully opaque veil, and the
veil is removed afterward. Preference covers fill the viewport, including navigation;
page covers leave the header visible. Language uses a horizontal curtain, theme uses a circular wipe anchored to its
toggle, and pages retain the content fade. Browser checks distinguish all three
effects. Total motion is about 0.8 seconds. Header position and lab DOM identity survive lesson
navigation. Reduced-motion mode commits immediately without a veil. AnimatedRoutes
retains the outgoing route and preloads the destination chunk before its covered
commit. The preference update no longer triggers the provider before the cover.

## CI/CD learning path

Four bilingual lessons at /courses/cicd cover repository setup, Pages settings,
automated checks / artifact deployment, and release troubleshooting. Students use
their own connected computer and GitHub account; the Linux lab has no internet.
The downloadable starter in course-projects/pages-notes has its own pinned lockfile,
two passing data tests, a verified /my-linux-notes/ production build and a workflow
that checks pull requests and deploys only main. No student repository was created
or published by the agent.

## Active component mapping

| Feature | Components / data |
| --- | --- |
| Persistent header, footer and fixed learning shell | src/components/Layout.tsx, src/style.css |
| CR/US language button and shared selects | src/components/LanguageButton.tsx, Select.tsx |
| CI/CD lessons / student starter / downloadable workflow | src/data/lessons.json, course-projects/pages-notes, scripts/package-course-starter.mjs |
| Introduction | src/features/Landing.tsx |
| Course/workshop catalog | src/features/Courses.tsx, src/data/courses.json, workshops.json |
| Independently scrolling lesson and references | src/features/Lesson.tsx, src/data/lessons.json, legacy-examples.json |
| Fixed desktop lab / mobile modal drawer | src/components/InlineLab.tsx |
| Account-wide active lab state / logout teardown | src/app/labs.tsx, src/services/labs.ts, src/app/auth.ts |
| AWS terminal framing / authenticated channel | src/services/ssm-terminal.ts |
| Offline exercise commands and validators | src/data/lab-exercises.json, labs/check.py |
| EC2 lifecycle / CAS lock / deadlines | backend/service/src/labs, infra/temporary-labs.yml |
| Preloaded image builder | labs/ec2/bake.sh, scripts/prepare-ec2-pack.sh, build-ec2-image.mjs |
| Dashboard / rewards | src/features/Dashboard.tsx, src/services/progress.ts, rewards.json |
| Accounts / explicit sync choice | src/features/Account.tsx, Register.tsx, src/app/providers.tsx |
| Resources / curated author page | src/features/Resources.tsx, src/data/about.json |
| Progress API / private S3 | backend/service/src/controllers, services, repositories; infra/progress-api.yml |
| Cognito / public settings | infra/cognito.yml, ssm-frontend.yml |
| Prepared email templates | emails/, infra/cognito-emails.yml |
| Pages artifact and both backend functions | .github/workflows/pages.yml, backend.yml |

Original source preservation: docs/legacy-source.json and codex/legacy-static-course.
The earlier browser runtime is abandoned and excluded from the frontend build.

## Independent backend and email repositories

Sources moved to private linux-lab-backend and linux-lab-cognito-templates repositories.
Both are ignored local checkouts; the Pages build no longer installs backend packages.
Frontend (19), backend (12) and email (four suites / eight templates) checks pass.
Cognito DEVELOPER sending is enabled from Linux Lab <linux-lab@jcampos.dev>.
PreSignUp and CustomMessage permit only explicit SES email identities with successful
verification, irrespective of SES production-access status. Deployed resolver checks
passed all eight variants and both eligibility branches. Actual unapproved signup
was rejected before account creation; no mail was sent by these verification checks.
The new repositories use immutable OIDC subjects from GitHub's repository metadata.

## SES production delivery — October 8, 2026

Supersedes the earlier verified-recipient policy above: PACIFIC-PROD / us-east-1
reports ProductionAccessEnabled=true, SendingEnabled=true and HEALTHY enforcement.
The app recipient allowlist and Cognito PreSignUp guard are removed. AWS manages
SES identities/delivery, while Cognito still verifies account email ownership.
All eight branded ES/EN templates remain enabled. Live verification invokes the
resolver with synthetic recipients and checks the pool wiring without sending mail.

## Mobile header, native authentication and lab preflight

The phone header keeps the brand, flag, theme, account and menu on one row at
320/375/390/768px with 44px action targets. Mobile lesson footers follow the
workspace in document flow. Desktop lesson/sidebar/terminal layout stays fixed.

Amplify SRP sign-in, recovery, email confirmation and challenges use in-app forms.
The hosted redirect configuration/listener is removed from the frontend. A disposable
Cognito account with email sending suppressed verified native browser SRP login,
S3 progress sync, GET /labs and account deletion. Visiting a lesson sent no lab POST.

The reported lab-status error was reproduced as HTTP 401 on the browser OPTIONS
preflight: authenticated ANY routes also caught OPTIONS. Explicit anonymous OPTIONS
routes for /me, /labs and /labs/{proxy+} now return 204. All actual data/compute routes
retain JWT authorization. See [AWS CORS guidance](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html).
