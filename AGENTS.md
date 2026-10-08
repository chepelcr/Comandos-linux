# Workspace guidance

This repository is migrating from static HTML to React and Vite.
Read `docs/implementation-plan.md` and `docs/content-inventory.json` before migration work.
The plan includes both completed work and pending validation; consult deployment-state.json and verification notes before making completion claims.

The primary application taller is React + Vite + Node.js/Express; read
`docs/modern-workshop.md`. Preserve Apache/PHP/MariaDB/Nextcloud as a separate legacy
track. Preload installable Node/npm artifacts and all lockfile dependencies so students
perform actual offline installations/builds. Prioritize a supported 64-bit guest
toolchain; do not downgrade to obsolete Node/Vite to fit an emulator.

For interface design, implementation, and review, use the workspace skill at
`.agents/skills/ui-ux-pro-max/SKILL.md`. Run its searches from this repository.
Read `design-system/comandos-linux/MASTER.md` for the project's tailored direction.
The user's request for both light and dark mode takes precedence over dataset recommendations.

Preserve every mapped example, workshop step, resource, author detail, and download.
Use stable content IDs and a source-to-destination manifest. Keep original sources until
content parity is verified. The tracked `dist/` currently contains source assets, so do
not overwrite it with Vite output until those assets have been relocated.

GitHub Pages hosts the frontend. Account progression needs its own authenticated API.
The current user-approved lab architecture is temporary EC2 (supersedes the earlier
browser-WASM plan). Use an isolated VPC, no internet gateway/NAT/peering, dedicated
security groups and narrowly scoped management endpoints. Preload every dependency.
One active lab per Cognito subject across routes/tabs/devices, enforced server-side.
Students must end the current lab before starting another route. Logout must terminate
its instance before clearing credentials. Enforce 30-minute inactivity and 90-minute
absolute limits independently of the browser; terminate instances and delete volumes.
Keep the lesson beside the terminal. Do not publish the abandoned WASM runtime.
Frontend configuration is public. Never put AWS credentials or client secrets in Vite variables.

Progression is stored in private S3 JSON objects behind the Cognito JWT API, with
ETag conditional writes. Guest data stays local. Ask the learner to choose local or
online progress before replacing either differing, nonempty copy on sign-in.
Branded Cognito emails are enabled only for explicitly verified SES email identities.
SES currently has production access, so the Lambda enforces the recipient restriction.
Backend and email sources are private independent repositories in ignored backend/
and emails/ folders. See docs/repositories.md. Never commit their contents here.
Use the shared Select component for themed dropdowns and keyboard support.
Original sources live on codex/legacy-static-course; see docs/legacy-source.json.
