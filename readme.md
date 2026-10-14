# 99Tech Code Challenge — Frontend

Solutions follow the original repository layout: `src/problem1`, `src/problem2`,
`src/problem3`


| Problem                    | Solution                                      | How to review                                                                               |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1 — Three ways to sum to n | src/problem1/solution.js                      | Three JavaScript functions with the exact supplied declarations. Call each with n.          |
| 2 — Fancy Form             | src/problem2/index.html, style.css, script.js | React + TypeScript + Vite currency swap form with token selection and simulated submission. |
| 3 — Messy React            | src/problem3/README.md, WalletPage.tsx        | Issue analysis and refactored snippet using the original host dependencies.                 |




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