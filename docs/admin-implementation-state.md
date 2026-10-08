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
linux-lab-courses-settings, linux-lab-courses-publication-access,
linux-lab-courses-role. Profile PACIFIC-PROD / us-east-1.

Publication deliberately requires a protected manual GitHub Pages workflow dispatch.
Only CI can finalize after verifying its deployed exact release marker. A future
GitHub App may automate dispatch. Structural changes require matching deployed
progression, lab image and validator capabilities. Private uploaded media is not yet
promoted into public course assets. Failed/expired deployment artifacts require
operator reconciliation; they are never reported as a successful publication.

Validation so far: public app 37 unit tests and 23 browser checks (3 viewport-specific
skips), 44 lessons / 28 original examples / 18 source documents preserved; 60 public
SEO pages; admin 6 tests; courses 38 tests; support 14 tests; existing backend 27 tests;
16 deployed student/staff email templates verified without mail delivery.

Rollout verification and first owner invitation are still in progress. Update this
line only after live identity/API checks and successful production workflows.
