# Search indexing and privacy

Implemented 2026-10-08. Production: https://linux.jcampos.dev/.

## Audit and changes

Previously, GitHub Pages returned HTTP 404 for direct lesson URLs, redirected visitors to the SPA root, shipped an empty root element, and declared the homepage canonical on every route. There was no sitemap, robots.txt, social preview, or privacy/terms page.

The Vite build now renders the actual React application into static HTML for every public route (including all 44 lessons), and account/settings/dashboard routes. Public pages contain their unique title, description, self-referencing canonical, Open Graph/Twitter metadata, readable content, and truthful Schema.org WebSite/WebPage/Course/LearningResource/BreadcrumbList data. There are no invented reviews, ratings, certificates or rich-result promises. Private utility pages have `noindex, follow` and are excluded from the sitemap. Crawling them is allowed so bots can see that directive; the API still requires authentication.

Directory index files give public routes successful responses on GitHub Pages. Canonical and sitemap URLs end with `/` because Pages redirects directory paths to their trailing-slash form. In-app navigation still uses the existing clean paths. Unknown direct URLs retain a genuine HTTP 404 and noindex instead of redirecting everything to the homepage. Old `/practice` links redirect to the corresponding lesson and are excluded from indexing.

The build generates `/sitemap.xml`, `/robots.txt`, `/images/social-card.png` and `.nojekyll`. It checks sitemap coverage against content IDs, unique titles, static headings, indexing directives, canonicals, social metadata and JSON-LD. There is no invented `lastmod`: add it only when an accurate per-page modification date is available. Public frontend SSM settings are still loaded before the build.

Spanish is the default canonical content; English remains available through the persisted language button and metadata updates with it. First-time visitors now receive Spanish, matching the static HTML. English does not have distinct URLs, so no misleading hreflang alternatives are published. Separate English paths and reciprocal hreflang are a future improvement if independent English search visibility is desired.

## Submit and verify ownership

1. Open https://search.google.com/search-console and add `https://linux.jcampos.dev/` as a URL-prefix property, or verify the `jcampos.dev` domain using a DNS TXT record.
2. For HTML-tag verification, set the GitHub repository variable `GOOGLE_SITE_VERIFICATION` to the token only, not the whole tag. Re-run the Pages workflow; the generator includes it in every static page.
3. Submit `https://linux.jcampos.dev/sitemap.xml`. Inspect the homepage and a lesson with URL Inspection and request indexing. Check rendered HTML and the chosen canonical.
4. Open https://www.bing.com/webmasters/ and import the verified Google property or add this site. HTML-tag verification uses repository variable `BING_SITE_VERIFICATION` (the `msvalidate.01` content token); rebuild before verifying. Submit the same sitemap.
5. Monitor Pages indexing, Crawl stats, sitemap errors and real-user Core Web Vitals. A correct sitemap and good SEO do not guarantee indexing, rankings or a deadline.

After a successful Pages deploy, `scripts/notify-indexnow.mjs` checks the deployed sitemap and public verification-key file, then notifies IndexNow of the public URLs. The key is intentionally public and confers no account/API access. The notification is advisory: failure does not undo a successful site deployment. Retry with `npm run seo:notify`. IndexNow covers Bing and participating engines; it does not submit to Google. Search-console ownership verification and submissions are still account-owner steps.

## Privacy and terms

`/privacy/` and `/terms/` are bilingual pages available from the footer and signup form. Signup requires separate, unchecked privacy-processing consent and terms acceptance. Account data export, reset and deletion remain available. This does not add marketing consent, advertising, analytics or a tracking cookie banner.

The privacy notice is based on the actual implementation: local progress/preferences, Amplify session storage, Cognito authentication, private S3 progression behind the authenticated API, transactional SES emails, temporary EC2 labs, AWS us-east-1, GitHub security IP logging, support contact and deletion choices. It does not claim all technical logs disappear immediately or that cloud data is hosted in Costa Rica. Lab files are temporary and must not contain real secrets or personal data.

The owner should review the published notice, terms, retention configuration, international processing and consent evidence against the audience and applicable obligations (including Costa Rica Law 8968). The current signup UI collects consent but does not maintain a server-side versioned consent ledger. These pages are an implementation-backed notice, not a certification of legal compliance. Re-review before adding analytics, payments, marketing, extra personal fields or persistent lab storage.

## Primary sources reviewed

- Google JavaScript SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google robots metadata: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google multilingual sites: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
- IndexNow protocol: https://www.indexnow.org/documentation
- GitHub Pages data collection: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection
- Costa Rica Law 8968, official INAMU copy: https://formatos.inamu.go.cr/SIDOC/DOCS/ley_8968.pdf
