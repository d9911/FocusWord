# FocusWord

[English](README.md) · [Русский](README.ru.md) · [Español](README.es.md)

![FocusWord](public/FocusWord.png)

![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=nodedotjs&logoColor=white)
![TypeScript 7.0.2](https://img.shields.io/badge/TypeScript-7.0.2-3178C6?logo=typescript&logoColor=white)
![Vite 8.3.2](https://img.shields.io/badge/Vite-8.3.2-646CFF?logo=vite&logoColor=white)
![HTML & CSS](https://img.shields.io/badge/UI-HTML%20%26%20CSS-e34f26)
![PWA](https://img.shields.io/badge/App-PWA-5A0FC8)
![Prettier 3.9.9](https://img.shields.io/badge/Prettier-3.9.9-F7B93E?logo=prettier&logoColor=black)

A simple word-by-word reader. Paste a text, choose your pace and keep the highlighted letter in focus.

![FocusWord — application preview](docs/images/app.png)

Font size can also be changed with a slider or the vertical ↕ drag handle. The reader shows an estimated total time, including enabled word pauses.

## Reading

- Adjustable speed: 60–1000 words/min, including during playback.
- Start, pause, replay, word navigation and progress control. Space toggles playback; arrow keys move one word.
- Font size, third-letter or adaptive anchor, optional pauses for punctuation and long words.
- English, Spanish and Russian; custom language/theme menus, system theme, responsive layout and reduced-motion support.
- PWA manifest, favicon and maskable icons; offline app files after the production build first loads online. Installation depends on the browser.

## Local development

Requires Node.js 24+ and npm. No framework, backend, database or Docker.

```sh
make            # install if needed, start and open the browser
make start      # same as make (aliases: make s / make S)
make init       # install dependencies without starting
make dev        # check dependencies, start and open the browser
make check      # TypeScript, tests and formatting
make build      # static HTML, JavaScript, CSS and PWA → dist/
make preview    # serve the build locally
make format     # apply Prettier
make screenshot # build and update docs/images/app.png (local Chrome)
```

The launcher installs from the lockfile when dependencies are missing or the installation fingerprint changes. It checks the direct dependency versions on each start. The first start initializes the fingerprint; subsequent starts reuse the installation. Requires Node.js 24+, npm and GNU Make on your PATH (including on Windows). The script uses npm.cmd on Windows and npm on macOS/Linux. Without Make, use `npm start` or `npm run dev`. Browser opening uses Vite; on a headless system, open the printed URL manually. Windows execution has not been verified locally.

`make`, `make start`, `make s` and `make S` install dependencies if needed, build `dist/` and start the development server. `make dev` skips the production build. Startup opens a local reset page that removes only the FocusWord offline worker and cache for this URL, then opens the reader. Language and theme preferences are preserved.

For screenshots, set `CHROME_BIN` if Chrome/Chromium is installed elsewhere. The task uses a temporary browser profile, an English demo and a local server. No screenshot tooling is required for normal builds.

## Structure

- `src/reader.ts`: playback and word timing; no DOM dependencies.
- `src/main.ts`: reader controls and rendering.
- `src/ui.ts` / `src/locales.ts`: interface behavior and translations.
- `src/types/`: shared types and interfaces; imported with `import type`.
- `src/pwa.ts` / `scripts/build-pwa.mjs`: installation and generated offline cache.
- `public/`: the only source copy of the logo, icons, manifest and served license.
- `tests/`: Node tests for playback, icon files and offline caching.

TypeScript is the source. `dist/` contains compiled JavaScript and static assets; do not edit it manually. This is one static application, not a distributed system.

## Privacy

Reading text is saved in localStorage in this browser and restored after reload; the app does not send it to a server. There are no analytics or tracking scripts. Language and theme are also saved locally; clearing site data removes these values and the text. Clearing only the HTTP/PWA cache does not clear localStorage; the service worker caches app files, not reading text. Hosting providers may keep access logs. External links open other sites; README badges are served by Shields.io and are not included in the application.

## Notes

The reader makes no promise of improved speed, comprehension or recall. [PWA details](docs/PWA.md) · [Verification](docs/VERIFICATION.md) · [Project context](docs/CONTEXT.md)

## License

Read the complete terms in [LICENSE](LICENSE). That file takes priority; this README does not replace or simplify its conditions.

[![License: see LICENSE](https://img.shields.io/badge/license-see_LICENSE-blue)](LICENSE)
