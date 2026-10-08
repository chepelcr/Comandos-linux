# React course migration implementation plan

Current repository boundaries supersede the original monorepo paths below:
backend/ and emails/ are ignored independent private checkouts. See
[repositories.md](repositories.md) for owners, CI and the AWS-managed production email delivery.

Prepared October 7, 2026; revised after browser-Linux research. Status: planning complete; application migration, AWS
templates, and deployment workflow remain implementation work. Workspace UI UX Pro
Max skill, tailored design direction, and baseline inventory have been added.

## 1. Scope and defaults

Rebuild this existing repository as React + TypeScript + Vite, retaining every
existing learning topic while adding a public introduction, structured lessons,
interactive practice, accounts, saved progress, checkmarks, points, translations,
light/dark themes, and purposeful motion. Use GitHub Actions artifact deployment
to GitHub Pages instead of publishing repository source from a branch.

Confirmed defaults: Spanish is the source/default language, English is the second
language, lessons remain publicly readable, and guests can practice before creating
an account. The user also requested a full Linux terminal for online learners; the
agreed approach is real Linux execution on the learner's device through WebAssembly,
with all exercise dependencies preloaded and no external guest internet access or
terminal infrastructure. Every exercise needs a working browser-local variant. See
`docs/offline-linux-lab.md` and `docs/browser-linux-research.md`. Keep the custom domain
unless changed by the owner. The confirmed canonical hostname is `linux.jcampos.dev`,
matching the tracked `CNAME` and updated JavaScript/documentation. Use this hostname
for production OAuth callbacks, sharing links and Pages configuration; preserve the
existing CNAME during preparation.

Interpretation of deployment request: Pages source becomes **GitHub Actions**;
pushes to `main` can trigger the workflow, but no generated `gh-pages` branch is used.

The primary taller is now React + Vite + Node.js/Express; see `docs/modern-workshop.md`.
Preserve the original Apache/PHP/MariaDB/Nextcloud workshop as a separate legacy stack
track. Add eleven modern checkpoints with new IDs; the original 28 examples and 20
workshop steps remain a preservation minimum, not the expanded curriculum total.

## 2. Verified current state and preservation baseline

- 18 root HTML files, including the legacy monolithic `old_index.html`.
- 28 command/example records, indices 0–27, embedded in `dist/js/script.js`.
- HTML fragments loaded through `include-html` and custom JavaScript; no package
  manifest, React setup, tests, or checked-in GitHub Actions workflow found.
- Bootstrap, jQuery, CodeMirror, Font Awesome, and SweetAlert loaded from CDNs.
- Live terminal is an iframe to `https://ssh.jcampos.me`; CodeMirror only displays examples.
- 11 Linux application workshop steps and 9 Git workshop steps.
- The Git workshop is included by `body.html` but has no visible main navigation entry.
- `obtener` is still mapped and appears in `old_index.html`; retain it even though
  the active example cards no longer expose it.
- Eight image assets, instructor biography/contact, five social links, three
  student resource cards, sharing behavior, and a downloadable firewall script.
- No standalone `.txt` content files found. Main hardcoded data is HTML and JS strings.

`docs/content-inventory.json` records source hashes, headings, includes, anchors,
example references, links, iframe URLs, and images. It is an audit baseline, not
the future lesson database. Migration must additionally compare all visible prose,
lists, command bodies, and legacy-only details; matching counts alone is insufficient.

### Source-to-feature/component mapping

| Existing source | Future destination | Components / preservation |
| --- | --- | --- |
| `index.html` | Vite entry and app providers | `App`, `AppProviders`, router, error boundary |
| `nav.html` | Shared navigation | `AppHeader`, `CourseSidebar`, mobile navigation |
| `body.html` | Course catalog/dashboard | `CourseCatalog`, `ModuleCard`, `ContinueLearning` |
| `introduccion.html` | Landing plus first Linux lesson | `LandingPage`, `IntroductionPage`, `LessonRenderer` |
| `conceptos_basicos.html` | Linux foundations module | CLI, SSH, users, packages; retain explanatory prose |
| `utilidades.html` | Files and tools module | Files, permissions, VI, compression |
| `seguridad.html` | Security module | Root access, fail2ban/brute-force protection, firewall |
| `ejemplos.html` | Legacy services module/reference | Preserve Apache, PHP, MySQL/MariaDB, PHPMyAdmin; add separate modern Node/React content |
| `taller.html` + `contenido.html` | Legacy Linux deployment workshop | Preserve all 11 original steps; new primary React/Node workshop uses separate stable IDs |
| `git_taller.html` + `git_contenido.html` | Git/GitHub course | `CoursePage`, `LessonPage`; all 9 steps and visible navigation |
| `terminal_ejemplo.html` | Code/example presentation | `CodeBlock`, `CopyButton`, `ExampleDrawer` |
| `curso.html` | Learning resources page | `ResourceCard`; NetAcad, Microsoft, GitHub Education |
| `perfil.html` | Welcome and instructor page | `WelcomeSection`, `InstructorCard`; biography and contact |
| `compartir.html` | Route-aware sharing | `ShareButton`, `ShareDialog`; native share and clipboard fallback |
| `footer.html` | Shared footer | `AppFooter`; credits/social destinations; privacy and terms links |
| Route and lesson metadata | `src/app/seo.ts` | Shared page metadata, canonical URLs, social cards and JSON-LD |
| Privacy and terms content | `src/data/legal.json`, `src/features/Legal.tsx` | Bilingual notices, contact, storage choices and signup consent |
| Public route catalog | `scripts/prerender-seo.mjs`, `scripts/check-seo.mjs` | Static React HTML, robots.txt, sitemap and build validation |
| `dist/js/script.js` | JSON content and feature services | All 28 examples, copy/download behavior, notifications |
| `dist/js/load_page.js` | React composition and utilities | Remove HTML loader after parity; derive share URL from app config |
| `dist/css/*` | Design token and component styles | Retire legacy styling after visual parity review |
| `dist/img/*` | `public/images/` | Keep all meaningful images and descriptive alt text |
| `public/files/firewall.sh` | Downloadable lab asset | Keep functional download, filename, and lab context |
| `server ngnix webssh.sh` | Archived infrastructure reference | Document retirement of old proxy; no runtime dependency |
| `old_index.html` | Legacy content audit/archive | Compare unique prose, examples, links, and behavior before retirement |
| `CNAME`, `README.md`, `CLAUDE.md` | Deployment and development docs | Reconcile hostname; replace obsolete Jekyll/static-app guidance |

### Complete original example mapping

The mappings below describe preserved original/legacy destinations. The new main
workshop has its own `modern-*` IDs in `docs/modern-workshop.md`; do not reuse old
Apache/PHP IDs for Node/React or transfer completion between unrelated exercises.

Stable IDs should preserve these existing identifiers so source references remain
traceable. Shared examples may appear in several lessons without duplicated reward grants.

| Index | ID | Content destination |
| --- | --- | --- |
| 0 | `apache` | Apache installation and workshop step 5 |
| 1 | `php` | PHP installation and workshop step 7 |
| 2 | `crear_usuario` | Users and workshop step 1 |
| 3 | `mysql` | MariaDB/MySQL and workshop step 6 |
| 4 | `vi` | VI/Vim editor reference and practice |
| 5 | `phpmyadmin` | PHPMyAdmin and workshop step 8 |
| 6 | `compresion` | gzip, bzip2, xz, tar, zip/unzip |
| 7 | `permisos` | Users/groups, ownership, permission modes |
| 8 | `cli` | CLI fundamentals |
| 9 | `obtener` | Legacy sample-site download reference |
| 10 | `firewall` | Firewall and workshop step 3 |
| 11 | `ingreso` | Root login restrictions and workshop step 2 |
| 12 | `fuerza` | fail2ban and workshop step 4 |
| 13 | `paquetes` | Package management |
| 14 | `gestion_archivos` | File management |
| 15 | `ssh` | Remote SSH connection |
| 16 | `descargar` | Site download and workshop step 9 |
| 17 | `configurar` | Web application/Nextcloud configuration and workshop step 10 |
| 18 | `ssl` | HTTPS/Certbot and optional workshop step 11 |
| 19 | `git_instalacion` | Git installation on macOS, Linux, Windows |
| 20 | `git_configuracion` | Name, email, main branch, global settings |
| 21 | `git_ssh` | SSH key creation and GitHub authentication |
| 22 | `git_basicos` | Init/clone/status/add/commit/log |
| 23 | `git_remotos` | Remote, push, pull |
| 24 | `git_ramas` | Branches, switch, merge, branch removal |
| 25 | `git_utiles` | Diff, restore, stash, blame, gitignore |
| 26 | `git_errores` | Common errors, amend, reset |
| 27 | `git_opcionales` | Editor, aliases, colors, SSH commit signing |

Content corrections must be tracked independently from preservation: examples pin
PHP 8.1 and Nextcloud 21.0.1, one path says `/let/www/html`, database grants are
broad, and firewall links disagree (`files/firewall.sh` versus
`public/files/firewall-iptables.sh`). Keep the original in the migration archive,
publish corrected/reviewed lessons with a change record, and use isolated practice
for privileged operations. Never execute legacy scripts to discover their content.

## 3. Application architecture and navigation

Use a supported React/Vite pairing, npm lockfile, explicit supported Node version,
TypeScript strict mode, ESLint, Vitest/Testing Library for behavior, and Playwright
for critical user journeys. Resolve and pin compatible versions during implementation.
Use React Router hash navigation to avoid Pages refresh 404s, i18next/react-i18next
for localization, schema validation for JSON/config, and a small consistent SVG icon set.
Lazy-load lesson routes, code highlighting/editor, and terminal implementation.
Prefer CSS transitions; add a motion library only for interactions that need it.

Routes: `/#/` introduction/landing; `/#/courses`; `/#/courses/:courseId`;
`/#/learn/:courseId/:lessonId`; `/#/workshops/:workshopId`; `/#/practice`;
`/#/dashboard`; `/#/resources`; `/#/about`; `/#/account` and settings.
Preserve known legacy fragments through an explicit alias map; review bookmarks to
direct `.html` files and provide redirect stubs where necessary. Unknown routes need
a useful not-found page and return to catalog.

Suggested layout:

```text
src/
  app/                 router, providers, config, error boundaries
  components/ui/       Button, Card, Dialog, Drawer, Tabs, ProgressBar, Toast
  components/layout/   AppHeader, AppFooter, CourseSidebar, Breadcrumbs
  features/landing/    LandingPage, CoursePreview, InstructorCard
  features/courses/    CatalogPage, CoursePage, LessonPage, LessonRenderer
  features/practice/   TerminalPanel, PracticeAdapter, ExerciseRunner, HintPanel
  features/progress/   DashboardPage, StepChecklist, PointsBadge, AchievementCard
  features/auth/       AuthProvider, AccountPage, callback handling
  features/settings/   LanguageSelect, ThemeSwitch, account preferences
  data/                courses, lessons, examples, workshops, resources, schemas
  locales/es/          interface and lesson translations
  locales/en/          interface and lesson translations
  services/            authenticated API, local progress, sync, sharing
infra/                 cognito.yml, progress-api.yml, ssm-frontend.yml, github-oidc.yml
scripts/               migration, content verification, SSM config loader
labs/                  optional local Linux lab and loopback terminal bridge
docs/                  component map, setup, deployment, content change log
```

Move tracked assets out of legacy `dist/` before enabling Vite's default output
directory cleanup. Preserve a source snapshot in an explicitly named archive,
excluded from public output, until parity checks pass. No old HTML include system
or CDN dependency is required by the new runtime.

## 4. JSON content migration and translations

1. Extract all 28 JS string values without running the original app, preserving
   newlines, quoting, tabs, commands, comments, and source index. Validate against
   the baseline and the old example-to-title switch mapping.
2. Convert HTML prose/lists/headings into typed JSON blocks: paragraph, heading,
   list, callout, code reference, image, link, and download. Do not store whole
   legacy HTML as the permanent React rendering model.
3. Define schema versions, stable course/module/lesson/exercise IDs, prerequisite
   references, estimated duration, difficulty, optional steps, and reward rules.
   Every record has source provenance, review status, and content version.
4. Separate reusable command records from lesson explanations; JSON stores commands
   verbatim and localized explanatory comments without translating shell syntax.
5. Store a migration manifest for every original block/example/link/asset with its
   destination ID or a documented duplicate/archive/correction disposition.
6. Add Spanish and English interface strings, all lesson prose, hints, quizzes,
   achievements, terminal help/errors, resource descriptions, and email UI text.
   Preserve names/URLs/commands. Mark missing translations in authoring checks;
   Spanish fallback prevents blank pages but is not counted as completed translation.
7. Validate locale parity, placeholder/plural parity, referential integrity,
   unique IDs, all 28 mappings, all 11+9 workshop steps, download paths, and legacy
   unique text disposition. Review English translations before release.

Locale selection: saved preference, supported browser locale, then Spanish.
Use `Intl` for dates/numbers and update the document language and page title.
Theme and language switches must preserve the current lesson and practice state.

## 5. Terminal replacement without the old app

The latest direction is **real Linux inside the browser without our own terminal
compute infrastructure**. The previous mandatory hosted-VM architecture is superseded
by `docs/offline-linux-lab.md`: preload all dependencies, use real Linux commands,
and adapt external integrations to local exercise fixtures. This does not remove the
separate Cognito/progression backend.

| Mode | Runs where | Scope |
| --- | --- | --- |
| Browser Linux, required | Learner device, WebAssembly emulator | Real Linux kernel/files/processes, all dependencies preloaded, all exercise variants runnable without guest internet; prototype v86 and container2wasm before selection. |
| Lightweight practice, optional fallback | Learner browser | Clearly labeled simulation for unsupported/low-resource devices; not the full Linux terminal. |
| Local Linux lab, optional | Learner's isolated local VM/container | Supplementary environment; does not replace browser exercise coverage. |

Implement `LinuxRuntimeAdapter` for boot/stop, serial input/output, resize, reset,
file upload/download, state save/restore and capability detection. Use xterm.js for
terminal display/input. Lazy-load runtime assets only when the learner starts a lab;
show download/boot status and a recoverable error. Do not promise full Bash/kernel
behavior for a simulated fallback.

Prioritize a 64-bit container2wasm guest for the supported Node/Vite toolchain,
comparing v86 for baseline Linux exercises (its guest is limited to 32-bit).
Both engines need actual compatibility/performance tests; container2wasm is experimental. WebVM/CheerpX remains
an alternative with vendor licensing and Tailscale networking considerations. Build
an image with pinned tools, local Git fixture repositories, cached OS packages,
installable Node/npm artifacts, complete locked npm dependencies/build binaries and
course files. Students install dependencies themselves; bundle the cache rather than
only a ready-made node_modules tree. See `docs/modern-workshop.md`. Docker/image construction may run in CI; learners should not need
Docker for browser execution. Verify engine and bundled guest package redistribution.

Prototype gates: actual guest kernel, file/process/permission changes, usable cold
and cached boot, package installation, Git, persistence/export/reset, browser matrix,
and acceptable image delivery size. Separately prove systemd/PID 1, cgroups, netfilter,
fail2ban, Node/npm installation, React/Vite builds, Express API, unprivileged Node
service/HTTP preview and the preserved legacy Apache/PHP/MariaDB/Nextcloud track. A working shell is not evidence
that all administration lessons work. Map findings to every existing example/step.

Preload tools, complete package dependencies, local repositories, application archives,
manual pages and exercise fixtures. Disable all external guest networking; internal
loopback/private virtual networking remains available for actual SSH, HTTP, SQL,
firewall and TLS exercises. Use local Git remotes over SSH, a local package repository,
a fixture download server, and lab certificates/local certificate authority. If preserving
the Certbot workflow, include and verify a local ACME test service. Preserve original
GitHub/public DNS/certificate instructions as production reference, clearly distinguishing
them from offline variants. See the complete adaptation map in `docs/offline-linux-lab.md`.

Fully load and verify any course pack before its exercises become available. Account
sign-in/sync still uses online app services; unavailable sync must not block an already
loaded guest. Prove rendered local-service preview as well as terminal-side HTTP checks.

Store writable state locally where supported, with image/version migration, storage
quota/eviction handling, explicit export/import and reset. VM disks do not sync merely
because course progress does. Keep VM state separate from account tokens and validate
storage isolation on logout/account switching. Terminal validation runs client-side
and does not become tamper-proof certification.

For optional real local practice, use an isolated disposable VM/container and a loopback
PTY bridge with origin/session checks. Never expose the host shell or host firewall.
Use a VM for lessons requiring systemd unless the selected container recipe explicitly
supports those needs. Document start/reset/stop and external networking requirements.

Acceptance: Linux runs in the browser from static Pages assets, no learner AWS compute
session is created, files change inside the real guest, reset/export work, and the old
SSH service/public demo relays are unnecessary. Full course capability parity is a
separate gate: all original 28 examples and 20 workshop steps, plus the eleven modern
React/Node checkpoints, need functioning browser-local
variants and preserved production references. Evaluate another browser engine/image
if required features fail. EC2, terminal WSS gateways, lab APIs and internet relays are
out of scope. Do not count a local-VM-only exercise as completed browser coverage.

## 6. Course progression, points, and account behavior

Model lesson status as not-started/in-progress/completed, plus exercise attempts,
quiz outcomes, workshop checkpoints, last lesson, bookmarks, module progress, points,
and earned achievements. Keep reading/reference access open; prerequisites guide
the path without hiding existing material. Optional SSL does not block required completion.

Default reward rules: first lesson completion 10 XP, first successful exercise 20 XP,
first module completion 50 XP. Store rules in versioned JSON and make awards idempotent
by user + activity + reward version. Reopening, toggling a checkmark, retries, and
offline sync must not award duplicates. Distinguish read acknowledgments, self-reported
lab completion, and validated exercises; browser results are client-reported and are
not proof for competitive rankings or certification. No leaderboard in this scope.

Guests persist progress in versioned local storage/IndexedDB. Signed-in users sync
through an authenticated API to private S3 JSON objects, with an offline queue, bounded retries,
and explicit pending/saved/error states. Merge guest work once on sign-in with stable
event IDs; isolate queues by user, clear session data on logout, and never apply one
account's progress to another. Merge completions monotonically; use revisions for
preferences/bookmarks, and an explicit reset action when intentional clearing is needed.
Content updates use stable IDs and migrations so existing progress remains meaningful.

## 7. Cognito and progress infrastructure templates

`infra/cognito.yml` (CloudFormation): email sign-up, verified email, public app client
with **no client secret**, email recovery, password policy, configurable pool domain,
authorization-code flow with PKCE/S256, explicit localhost and production callback/logout
allowlists, and outputs for region, pool ID, client ID, issuer, and auth domain. Document
email sending limits and configurable production sender setup rather than assuming delivery.

Use a maintained OIDC client library and Cognito managed login for sign-up, verification,
sign-in, resend/recovery, and sign-out. The React UI shows account state, profile settings,
session expiration, loading, and actionable errors. Implement state/nonce verification,
callback cleanup, protected dashboard navigation, and a defined token refresh/storage policy.
Keep access tokens out of URLs/logs; progress API requests use the access token.

OAuth redirect URIs cannot contain hash fragments. Use the deployed base URL itself
as the callback (`https://<domain>/` or `https://<user>.github.io/Comandos-linux/`),
process `?code=...&state=...` before initializing hash routing, then restore a validated
same-app return route. Test localhost, custom domain, and repository subpath redirects.

`infra/progress-api.yml` (SAM/CloudFormation): API Gateway HTTP API, Cognito JWT authorizer,
Lambda handlers, and private S3 snapshots with conditional ETag writes. Scope every read/write to the verified JWT `sub`; never
trust a user ID supplied by the browser. Validate request shapes and known activity IDs;
calculate XP server-side from accepted events and prevent duplicate grants with conditional
writes/transactions. Scope CORS to actual app origins; add throttling, bounded logs,
least-privilege IAM, retention/backups, and useful operational failure visibility.

Endpoints: read progress; submit idempotent completion/attempt events; update preferences;
export user data; reset progress; delete account/progress. Define deletion ordering and
retry behavior across Cognito and S3; clear account-associated local lab state
as part of deletion. Cognito alone does not persist course state.
Do not add an identity pool unless a later feature requires direct AWS resource access.

## 8. SSM frontend parameter template and build contract

`infra/ssm-frontend.yml` provisions public `String` parameters under
`/comandos-linux/<environment>/frontend/`, taking deployed Cognito/API outputs as inputs.
Publish these exact names for explicit loading before Vite builds:

| Parameter suffix | Frontend variable | Meaning |
| --- | --- | --- |
| `aws-region` | `VITE_AWS_REGION` | Cognito region |
| `cognito-user-pool-id` | `VITE_COGNITO_USER_POOL_ID` | User pool and issuer derivation |
| `cognito-client-id` | `VITE_COGNITO_CLIENT_ID` | Public app client |
| `cognito-domain` | `VITE_COGNITO_DOMAIN` | HTTPS managed-login base URL |
| `auth-redirect-uri` | `VITE_AUTH_REDIRECT_URI` | Exact allowlisted callback |
| `auth-logout-uri` | `VITE_AUTH_LOGOUT_URI` | Exact allowlisted logout destination |
| `api-base-url` | `VITE_API_BASE_URL` | Authenticated progression API |
| `app-url` | `VITE_APP_URL` | Canonical deployed URL, sharing |
| `base-path` | `VITE_BASE_PATH` | `/` on custom domain, `/Comandos-linux/` on repo Pages |
| `default-locale` | `VITE_DEFAULT_LOCALE` | `es` by default |

The build loader uses a fixed mapping, fetches exact required parameters, validates
region/IDs/HTTPS URLs/locale/path consistency, rejects missing or unexpected values,
and exports safely without `eval` or untrusted shell interpolation. Production builds
fail if required auth/API parameters are absent. Validate redirect URI origin/base
against `app-url` and ensure it contains no fragment. Do not silently publish demo auth.

All `VITE_*` values end up in public assets. Never include AWS keys, Cognito client
secrets, database credentials, tokens, or other private SSM data. Use a dedicated public
configuration namespace and exact-name least-privilege SSM reads. Local development
gets `.env.example`, ignored `.env.local`, and a clearly labeled guest/offline mode.
Changing SSM values requires a new build/deploy; the browser does not call SSM.
Browser Linux runtime/image/pack URLs are versioned build assets. No lab API/WSS
parameters or cloud terminal resources are required.

## 9. GitHub Actions Pages deployment

`infra/github-oidc.yml` defines a GitHub OIDC role with trust restricted to this repository
and the chosen protected deployment environment, plus read access only to the required
frontend SSM parameters. Reuse an existing account-level OIDC provider if present.
Separate infrastructure provisioning permissions from the frontend deployment role.

GitHub configuration: `AWS_REGION`, role ARN, SSM namespace/environment, canonical host,
and Pages environment. AWS access uses short-lived OIDC credentials, not stored access keys.
Deploy infrastructure in order: OIDC/bootstrap role, Cognito, progression API, SSM outputs,
then frontend. Resolve the host/callback URLs before Cognito setup and bootstrap SSM
before enabling production builds, avoiding a deployment configuration cycle.

Workflow:

1. PR validation runs install, type/lint checks, content/locale/schema checks, tests,
   and a guest/test-config build; fork PRs get no production AWS access.
2. Main/manual production job installs with the lockfile, passes validation, assumes
   the deployment role through OIDC, retrieves/validates SSM values, and builds Vite.
3. Configure Pages, upload **only build output** as the Pages artifact, and deploy
   through `deploy-pages` to the `github-pages` environment. Use minimal job permissions:
   contents read, OIDC token write where needed, Pages write for deployment.
4. Pin actions to reviewed immutable revisions, control deployment concurrency,
   and run post-deploy smoke checks for landing, assets, download, and callback URL.
5. Set repository Settings → Pages → Source to GitHub Actions; configure the canonical
   custom domain there and retain appropriate DNS/HTTPS settings. No generated branch.

Before cutover, relocate assets and test both Vite base path modes. Do not upload source
archives, skill datasets, local env files, infrastructure files, or lab credentials.
Rollback means redeploying a known good artifact/commit with compatible config; keep
the prior deployment available and avoid deleting legacy sources before parity review.

## 10. Design, accessibility, and complete UI states

Use `design-system/comandos-linux/MASTER.md` and workspace UI UX Pro Max guidance.
Build the landing and representative lesson/dashboard screens first to settle typography,
colors, spacing, and component contracts before applying them everywhere.

Include light/dark theme persistence without first-paint flash, Spanish/English
selection, responsive outlines, visible focus, keyboard-accessible dialogs, readable
code with contained horizontal scroll, copy feedback, and clear errors. Include signed-out,
empty dashboard, loading, session-expired, offline/pending sync, unavailable lab, and
invalid-link states. Motion conveys progress/relationships and honors reduced motion.
Check WCAG AA contrast in both themes and meaningful labels/status announcements.

## 11. Implementation sequence and acceptance gates

| Phase | Deliverables | Completion gate |
| --- | --- | --- |
| 0 — Baseline/design | Inventory, skill wiring, migration manifest specification, design/component mapping | Present plan artifacts; resolve canonical host before infrastructure rollout |
| 1 — React foundation | Vite/React/TS, assets relocation, routing, shared primitives, themes/localization shell, introduction | Local dev/preview run; landing and deep links work at root/subpath |
| 2 — Content parity and modern curriculum | JSON schemas, legacy extraction, new main React/Node workshop, resources/about, complete ES/EN | Preserve 28 examples, 11 legacy Linux steps and 9 Git steps; add all 11 modern checkpoints with separate IDs |
| 3 — Browser Linux feasibility | 64-bit Node/Vite-capable runtime prototype, v86 comparison, image/OS/npm packs, adapter, capability report | Real Linux, clean offline npm install, React build/API/service and legacy exercises assessed; performance measured |
| 3b — Interactive learning | Selected browser Linux terminal, exercises/hints/quizzes, guest persistence, checklist/XP/dashboard | Guest effects and reward idempotency verified; old SSH domain unused |
| 4 — Supplementary local lab (optional) | Linux sandbox, loopback bridge, reset/start/stop docs, capability labeling | Real Linux session works locally; no host shell/firewall exposure |
| 5 — Accounts/cloud progress | Cognito/API templates, auth UI/callback, authenticated storage/sync, export/deletion | Real test account signs up, verifies, recovers, signs out; second device sees progress |
| 6 — Complete offline lab coverage | Preload OS/npm dependencies; prove React/Node workflow, services/systemd/firewall/SSH/preview and local Git/TLS equivalents | Original 28 examples/20 steps and all 11 modern checkpoints tested browser-locally; no external guest networking or terminal servers |
| 7 — SSM/Pages pipeline | SSM/OIDC templates, config loader, CI/Pages deployment, updated docs | Missing config fails; build fetches public params before build; Actions deploy works |
| 8 — Release validation | Visual/accessibility review, translation review, content corrections, cutover/rollback notes | Critical journeys pass in both locales/themes, mobile/desktop, reduced-motion and offline states |

Phases 1–4 can develop with guest/test configuration; phases 5–7 require an AWS account,
region, canonical hostname, and repository/environment configuration. Validate templates
locally first and then in a disposable AWS environment; local syntax checks alone do not
prove sign-up/email/deployment works. The user has requested a plan in this turn, so these
cloud resources and the new application are not being deployed as part of planning.

## 12. Verification and definition of done

- Content: compare original JS bodies exactly at extraction; track reviewed corrections;
  validate all source-block dispositions, links, downloads, images, JSON schemas,
  ID references, translations, and all mapped workshop steps.
- Unit/component: runtime adapter/guest state and optional simulator, exercise evaluation,
  optional step progress, points idempotency, guest migration, offline event deduplication,
  callback state validation, safe SSM mapping, and theme/locale persistence.
- API: missing/invalid JWT rejection, cross-user isolation, duplicate event handling,
  input limits, reset/export/deletion, and recovery after partial failure.
- Browser Linux: actual kernel behavior, image size, cold/cached boot, memory/input
  responsiveness, state reset/export/import, storage eviction, browser support, guest
  isolation, package/service/kernel capability checks, complete dependency packs and
  all exercises passing with external guest connectivity blocked. Include clean Node/npm
  installs, npm dependency installation, React/Vite development/build, API validation,
  persistence/restart and unprivileged service execution.
- End-to-end: introduction → course → lesson → practice → checkmark/points → reload;
  sign-up/verification/recovery → guest merge → second-device resume → sign-out;
  root/subpath callback, share link, firewall download, and local lab reset.
- UI: desktop/mobile screenshots in both themes/locales, keyboard navigation, dialogs,
  zoom, reduced motion, contrast, terminal focus/accessibility, and long translated labels.
- Deployment: no production secrets in output, lazy terminal bundle, no runtime CDN or
  old SSH dependency, public config loaded before build, Pages artifact deployment,
  canonical-domain HTTPS/callback behavior, post-deploy smoke checks, rollback path.

Delivery includes working code, required YAML templates, environment examples,
component/content mapping, reproducible browser Linux image/runtime instructions,
optional local lab instructions, AWS/SSM setup order, GitHub Pages
configuration instructions, and accurate README/agent guidance. Distinguish simulated,
locally verified, and cloud-verified behavior in the implementation handoff.

## Reference documentation

- [Vite static deployment and Pages base paths](https://vite.dev/guide/static-deploy.html)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [AWS OIDC for GitHub Actions](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [Cognito public app clients and PKCE](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)
- [Cognito authorization endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html)
- [SSM parameter access](https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParametersByPath.html)
- [xterm.js terminal UI](https://xtermjs.org/)

## Latest approved lab and interface revision (October 7, 2026)

This revision supersedes the browser-WASM lab requirement above. The user explicitly
chose temporary EC2 Linux laboratories with preloaded packages, no guest internet,
a dedicated isolated network/SG, 30-minute inactivity termination and 90-minute
absolute maximum. See `temporary-ec2-labs.md` for ownership, isolation and teardown.
The user confirmed **one lab per learning path**, shared across its lessons, with
End required before a different learning path starts. The account-wide lock applies
across tabs and devices. Logout terminates the active instance before credentials
are cleared. Reading/progress remain local for guests; EC2 labs require an account.

Lesson content and terminal sit side by side on desktop and stack on mobile.
Start/End controls live in the lesson workspace. Legacy /practice/:lessonId bookmarks
redirect to their clean lesson paths. The language control is a CR/US flag button,
page and preference transitions are slower, the mobile menu animates open, About has
a leading author photo and bilingual curated text, and the footer is a compact row
with the course-by-Pacific-Code-Labs credit replacing the personal copyright line.

### October 8 follow-up: CI/CD path and sidebar

Added a separate four-lesson ES/EN GitHub Pages path and a downloadable, independently
buildable React starter with a pinned lockfile, tests, repository-base build script,
matching local preview and Pages artifact workflow. The path uses the student's own
connected computer / GitHub account, not the isolated EC2 lab. Original content remains
mapped. About now appears in the navbar; its mission card uses the full content width.
The original favicon is restored byte-for-byte. Desktop outlines retain their full
lesson lists with independent scrolling, including short/tablet-width viewports.

### Current account component mapping

- `src/features/Account.tsx`: account shell and guest/account controls.
- `src/features/auth/AuthLayout.tsx` and `AuthContext.tsx`: dedicated authentication shell and memory-only flow state.
- `src/features/auth/AuthPage.tsx`: native Amplify SRP, registration, email verification, challenges and recovery.
- `src/features/auth/PasswordField.tsx` and `password.ts`: confirmation, requirements, strength and safe return paths.
- `src/features/auth/ConsentNotice.tsx` and `src/services/consent.ts`: explicit policy acknowledgement after verified sign-in.
- `src/features/Support.tsx` and `src/services/support.ts`: signed-in student tickets, replies and screenshots.
- `src/repositories/curriculum.ts`: bundled/published content adapter with compatibility and monotonic version guards.
- `src/app/providers.tsx`: authenticated state and local/online progression choice; calls the API.
- Private backend `ProgressController` → `ProgressService` → `ProgressRepository`: JWT-owned progression stored as private S3 JSON with conditional writes. The frontend never accesses S3 directly.

The lab maps `InlineLab` (session actions and exercise checks) to `LabLoading`
(indeterminate startup/connection animation), the authenticated check API and the
backend `ExerciseResult` boundary. Student exercise snippets contain lesson commands;
guest validator invocations stay behind the check button.


## Admin, course management and dedicated authentication (2026-10-08)

See [the reviewed planning document](admin-course-management-plan.md). Implementation and live verification are recorded in [admin-implementation-state.md](admin-implementation-state.md). The approved extension includes: separate private admin app and BE Builder-generated courses
and support backends, S3 persistence, invitation-only staff with MFA OFF, versioned
curriculum publication, and dedicated learner auth pages based on the Tsuru pattern
with the existing 12-character Cognito policy, password strength and confirmation.
No app code, new remote repositories or infrastructure are changed in this phase.
