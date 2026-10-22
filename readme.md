# 99Tech Code Challenge — Frontend

Solutions follow the original repository layout: `src/problem1`, `src/problem2`,
`src/problem3`, `src/problem4`, `src/problem5`


| Problem                    | Solution                                      | How to review                                                                               |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1 — Three ways to sum to n | src/problem1/solution.js                      | Three JavaScript functions with the exact supplied declarations. Call each with n.          |
| 2 — Fancy Form             | src/problem2/index.html, style.css, script.js | React + TypeScript + Vite currency swap form with token selection and simulated submission. |
| 3 — Messy React            | src/problem3/README.md, WalletPage.tsx        | Issue analysis and refactored snippet using the original host dependencies.                 |
| 4 — Crude server           | src/problem4                                  | Challenge problem 5. Express + TypeScript CRUD API and browser UI, persisted in SQLite.    |
| 5 — Live scoreboard module | src/problem5/README.md                        | Backend module specification: live top-10 board, score increment API, auth, flow diagrams.  |




## Problem 1

The problem asks for three JavaScript functions. `solution.js` contains exactly the supplied declarations. 

## Problem 2

From the repository root:

Development:

```sh
npm ci
npm run dev
```

Production build. This writes one self-contained `dist/index.html`, so the page can be opened directly in a browser:

```sh
npm ci
npm run build
```

Open `dist/index.html`.

See src/problem2/README.md for behavior and assumptions.

## Review Problem 3

Read src/problem3/README.md and WalletPage.tsx alongside original.tsx.txt.

## Problem 4

This directory holds challenge Problem 5, A Crude Server.

From `src/problem4`:

```sh
npm ci
npm run build
npm start
```

Open http://127.0.0.1:3001 for the CRUD page. See src/problem4/README.md for routes, filters, configuration, and assumptions.

## Problem 5

Specification only (no runtime code). See src/problem5/README.md for the live scoreboard API module: data model, HTTP/SSE contracts, authorization rules, Mermaid execution flows, and improvement notes for the backend team.