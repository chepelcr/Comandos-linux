# My Linux Notes · GitHub Pages starter

English: Follow the CI/CD learning path in Linux Lab. Requires Node 24, Git, internet
access on your own computer and a GitHub account. This static React application
stores notes in localStorage; it has no API, secrets or cross-device synchronization.

Español: Sigue la ruta CI/CD en Linux Lab. Necesitas Node 24, Git, internet en tu
computadora y una cuenta de GitHub. Esta aplicación React estática guarda las notas
en localStorage; no incluye API, secretos ni sincronización entre dispositivos.

```sh
npm ci
npm test
npm run dev
```

## Publish / Publicar

1. Create your own empty public GitHub repository (or copy these files into an
   existing cloned repository). Include the hidden `.github` directory.
   Crea tu repositorio público vacío o copia estos archivos dentro de uno clonado,
   incluida la carpeta oculta `.github`.
2. In **Settings → Pages → Source**, select **GitHub Actions**. Ensure official
   GitHub Actions are allowed in the repository. En **Settings → Pages → Source**,
   selecciona **GitHub Actions** y permite las acciones oficiales.
3. Commit and push to `main`. Confirm the `check` and `deploy` jobs in Actions.
   Confirma y sube los archivos a `main`; revisa `check` y `deploy` en Actions.
4. Open the deployment URL shown in the `github-pages` environment.
   Abre la URL publicada que aparece en el entorno `github-pages`.

`.github/workflows/pages.yml` tests every pull request and push to main. It deploys
only main after successful tests. No personal token, AWS account or `gh-pages`
branch is needed. The build script reads `PAGES_BASE_PATH`, provided automatically
by `actions/configure-pages`, so both `/repo/` and root/custom-domain sites work.
If your default branch differs, update both workflow branch filters and the
`refs/heads/main` condition.

El workflow comprueba cada pull request y push a main. Publica solo desde main tras
superar las pruebas. No requiere un token personal, AWS ni una rama gh-pages.
`configure-pages` proporciona automáticamente `PAGES_BASE_PATH`. Si cambias el
nombre de la rama principal, modifica los filtros y la condición refs/heads/main.

```sh
# Test a project path / Prueba una ruta de proyecto (bash/zsh)
PAGES_BASE_PATH=/my-linux-notes npm run build
npm run preview
# http://127.0.0.1:4173/my-linux-notes/
```

PowerShell: `$env:PAGES_BASE_PATH="/my-linux-notes"; npm run build`

Pages cannot run an Express server. Keep the Node/Linux workshop separate.
Pages no ejecuta Express. Mantén separado el taller de Node/Linux.

Official references / Referencias oficiales:
- https://vite.dev/guide/static-deploy.html#github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
