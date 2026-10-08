# Admin implementation and rollout

Updated 2026-10-08. Implementation approved after the planning review.

Implemented: separate admin UI and staff identity; MFA off; native Amplify staff
login/recovery/invitation flow; users directory; bilingual curriculum drafts,
revision history and CAS conflicts; immutable releases; private media; learner
support, private staff notes, screenshots, incidents and audit. Course authentication
uses dedicated pages with strength rules, confirmation and clean return paths.
Explicit privacy/terms acceptance has authenticated S3 history and server timestamps.

Private repositories are listed in repositories.md. The new services were generated
using BE Builder and adapted to private S3 JSON repositories, with no SQL dependency.

AWS resources: linux-lab-admin-accounts, linux-lab-admin-certificate,
linux-lab-admin-hosting, linux-lab-admin-role, linux-lab-support,
linux-lab-staff-gateways, linux-lab-support-role, linux-lab-courses,
linux-lab-courses-publication-access,
linux-lab-courses-role. Profile PACIFIC-PROD / us-east-1.

Publication deliberately requires a protected manual GitHub Pages workflow dispatch.
Only CI can finalize after verifying its deployed exact release marker. A future
GitHub App may automate dispatch. Structural changes require matching deployed
progression, lab image and validator capabilities. Private uploaded media is not yet
promoted into public course assets. Failed/expired deployment artifacts require
operator reconciliation; they are never reported as a successful publication.

Validation so far: public app 37 unit tests and 23 browser checks (3 viewport-specific
skips), 44 lessons / 28 original examples / 18 source documents preserved; 60 public
SEO pages; admin 6 tests; courses 39 tests; support 18 tests; existing backend 27 tests;
16 deployed student/staff email templates verified without mail delivery.

Live checks passed: staff SRP login and invitation password-change flow;
loaded private dashboard; S3 curriculum manifest; staff directory and learner details
before the first progression save; dedicated student login and support deep-link reload;
student/staff isolation; current-policy consent persistence; ticket creation; private
notes and stale-write rejection; real S3 screenshot and private course-image uploads,
checksum checks, image validation and attachment downloads. The first Owner invitation was accepted by Cognito
for email delivery. MFA remains off.

Production exact-release workflow 37835146220 passed, loading all 14 SSM settings,
building and deploying release-4c7a0efc-56b4-48b5-b4ca-1336af0dde3d, checking the
live marker/routes and activating sequence 1. Guest IAM published-content retrieval
was verified independently. API preflights are anonymous; data routes remain JWT
protected.

A dynamic private support deep link boots from GitHub Pages’ noindex 404 response;
GitHub Pages retains HTTP 404 for those dynamic URLs. Public missing pages keep a
real 404. Ticket navigation and sign-in return paths remain clean path routes.

### Student curriculum transport (2026-10-08)

The courses service exposes `GET /api/student/courses` alongside guest-only `GET /api/public/courses` on `courses-api.linux.jcampos.dev`. Student reads use the existing learner Cognito pool, access tokens and exact app client; the service independently verifies JWTs. Anonymous preflight is permitted; anonymous data, staff tokens and ID tokens are rejected. Both readers receive the same activated release, with no draft/candidate access. Session restoration/login/logout selects the appropriate transport and cancels obsolete requests. Existing frontend SSM values cover both endpoints; publication behavior is unchanged by this authentication update.

Verified this update with 42 frontend tests, 42 courses-service tests, production build/SEO checks and SAM lint. Deployed CloudFormation successfully. Live SRP checks verified student access, guest/student snapshot equality, anonymous/staff/ID-token rejection and browser preflight. Browser checks verified login selects the student endpoint, a restored session makes no guest curriculum request, and logout returns to guest IAM. Temporary QA users and their test progress were removed; no invitation email was sent.

### First-party usage and fleet monitoring (2026-10-08)

Owner dashboard monitoring uses private S3 usage records and a read-only metrics endpoint under `/api/admin/diagnostics/metrics`. The course sends empty authenticated or guest-IAM activity signals at most once per minute after activity, while visible; no pages, input values, terminal commands, email or IP fields enter those records. Do Not Track and Global Privacy Control disable collection. Counts distinguish five-minute active student subjects and guest browser identities, seven UTC days of daily identities, estimated registered accounts, and isolated EC2 lab states/deadlines. Counts can overlap across auth categories/devices and can undercount blocked signals. Owner-only metrics display collection time, unavailable sources and bounded-scan truncation. EC2 discovery uses the existing application tag plus dedicated VPC; existing reaper behavior is unchanged. Presence/daily retention is one/30 days with one-day noncurrent expiry. The bilingual privacy policy is updated, and collection is gated on that policy being included in the published curriculum.
