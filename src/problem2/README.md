# Problem 2 — Fancy Form

The task use: React, TypeScript and Vite currency swap form. 
The UI provides:
- searchable token selection
- token icons
- input validation
- exchange rates
- estimated USD values
- reverse direction
- request error/retry
- and simulated confirmation.

From the repository root.

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

The heading and descriptive text use the Problem 2 task: currency swap form, swapping assets from one currency to another, input validation, token images, token price information, and exchange rates. Operational labels and error messages explain the implemented interactions.

## Prices and calculation

Prices are loaded from the provided Switcheo API. Invalid entries are ignored, and the latest valid price is used for duplicate tokens.

Quotes use:

`receive = amount * sendPrice / receivePrice`

Decimal.js is used for calculation, with received amounts limited to 18 decimal places. Token-specific precision is not provided, so 18 decimals is used as a demo assumption.

Token icons come from the provided Switcheo repository, with the token initial used as a fallback.

## Interaction

The reverse button swaps both tokens and uses the current receive amount as the new input.

The two selected tokens are always kept different. Confirming a swap locks the quote, prevents duplicate submission, and shows a simulated receipt after one second.

If the price API fails, sample data can be used manually and is clearly labeled.

The token picker supports search and keyboard navigation. The UI is responsive and includes basic accessibility support.

