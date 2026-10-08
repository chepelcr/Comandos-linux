# CI/CD with GitHub Pages

The bilingual path `/courses/cicd` adds four lessons without replacing the original
Linux, Git, security, React/Node or LAMP content:

| Lesson | Outcome |
| --- | --- |
| `pages-repository` | Download the starter, test locally and connect an owned repository |
| `pages-configuration` | Enable Actions-based Pages and understand root/project/custom-domain asset paths |
| `pages-workflow` | Run checks on pull requests; deploy main using a Pages artifact |
| `pages-release` | Verify the published app, use pull requests, diagnose failures and revert a release |

Students use their own connected computer and GitHub account. This path does not
start an EC2 lab: isolated student instances intentionally cannot reach GitHub.
Completion tracks reading; it does not claim remote repository or deployment
verification. Existing local/online progress rules and point calculations apply.

`course-projects/pages-notes` is an independent React/Vite starter with a pinned
lockfile, Node 24, a localStorage notes application, real data tests, and an artifact
workflow. It does not require Cognito, an AWS account or the course backend.
`scripts/build-pages.mjs` normalizes the base path from configure-pages, and
`scripts/preview-pages.mjs` reuses that path when previewing the last build.
Pages hosts static files and cannot run the Express API from the Linux workshop.

Every course build regenerates `public/downloads/pages-notes.zip` from an explicit
file allowlist and copies `pages-workflow.yml`. Dependencies, build output, Git
history and environment files are excluded. The starter's `.github` folder is
included; students must preserve it when uploading the files to their repository.

The workflow has a read-only check job. Only the deploy job requests Pages/OIDC
write permissions, depends on checks, and runs from main outside pull requests.
Actions are pinned to the commits in the official Vite deployment example.
There is no personal token or AWS credential in the workflow.

Verified locally: starter tests, project-subpath build, browser add/check/reload,
download availability, YAML syntax, deployment guards and bilingual lesson routes.
Publishing a student repository remains an exercise performed by the student.

Sources:
- [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages)
- [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [configure-pages outputs](https://github.com/actions/configure-pages/blob/main/action.yml)
