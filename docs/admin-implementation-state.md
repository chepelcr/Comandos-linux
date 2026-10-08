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
loaded private dashboard; S3 curriculum manifest; staff directory;
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
