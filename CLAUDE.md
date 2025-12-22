# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational static website for learning basic Linux commands ("Comandos básicos de Linux"). Hosted on GitHub Pages at https://linux.jcampos.me/. Features interactive code examples with CodeMirror and an embedded WebSSH terminal for hands-on practice.

## Development

This is a pure static website with no build process, package manager, or test framework. To develop:

1. Open `index.html` in a browser (requires a local server for HTML includes to work)
2. Use any local server: `python3 -m http.server 8000` or VS Code Live Server extension

## Architecture

**HTML Include System**: The site uses a custom JavaScript loader (`dist/js/load_page.js`) that dynamically includes HTML fragments via the `include-html` attribute. The `index.html` loads three main components:
- `nav.html` - Navigation bar
- `body.html` - Main content container (loads other content sections)
- `footer.html` - Footer with social links

**Key JavaScript Files**:
- `dist/js/load_page.js` - HTML include loader, clipboard utilities, tooltip activation
- `dist/js/script.js` - Main application logic, CodeMirror setup, command examples

**Content Sections** (loaded as modals):
- `introduccion.html`, `conceptos_basicos.html`, `ejemplos.html`, `utilidades.html`, `seguridad.html`
- `taller.html` - Workshop with embedded SSH terminal (iframe to https://ssh.jcampos.me)

## External Dependencies (CDN)

- Bootstrap 5.3.3
- jQuery 3.6.0
- CodeMirror 5.52.2 (Monokai theme)
- Font Awesome 6.x
- SweetAlert2
