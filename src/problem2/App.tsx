import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { amountError, dollars, quote, rate } from "./domain.ts";
import { usePrices } from "./usePrices.ts";
import { TokenPicker } from "./TokenPicker.tsx";
import { TokenIcon } from "./TokenIcon.tsx";
const bitcoinImage = new URL("./assets/BTC.svg", import.meta.url).href;

interface Receipt {
  from: string;
  to: string;
  amount: string;
  output: string;
}
export default function App() {
  const { tokens, status, error, mode, retry, useSample } = usePrices();
  const [fromCurrency, setFrom] = useState("USDC");
  const [toCurrency, setTo] = useState("ETH");
  const [amount, setAmount] = useState("100");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const submitTimer = useRef<number | undefined>(undefined);
  const submitLock = useRef(false);
  useEffect(() => () => window.clearTimeout(submitTimer.current), []);
  useEffect(() => {
    if (tokens.length < 2) return;
    const nextFrom = tokens.some((t) => t.currency === fromCurrency)
      ? fromCurrency
      : tokens[0].currency;
    const nextTo =
      tokens.some((t) => t.currency === toCurrency) && toCurrency !== nextFrom
        ? toCurrency
        : tokens.find((t) => t.currency !== nextFrom)!.currency;
    if (nextFrom !== fromCurrency) setFrom(nextFrom);
    if (nextTo !== toCurrency) setTo(nextTo);
  }, [tokens, fromCurrency, toCurrency]);
  const from = tokens.find((t) => t.currency === fromCurrency);
  const to = tokens.find((t) => t.currency === toCurrency);
  const inputError = amountError(amount);
  const output = !inputError && from && to ? quote(amount, from, to) : "";
  const validation =
    inputError ??
    (fromCurrency === toCurrency
      ? "Choose two different tokens."
      : output === "0"
        ? "This amount is too small. Increase it to receive at least 0.000000000000000001 tokens."
        : null);
  const ready = status === "ready" && !!from && !!to;
  const valid = ready && !validation;
  const disabled = status !== "ready" || submitting;
  function select(side: "from" | "to", currency: string) {
    setReceipt(null);
    if (side === "from") {
      if (currency === toCurrency) setTo(fromCurrency);
      setFrom(currency);
    } else {
      if (currency === fromCurrency) setFrom(toCurrency);
      setTo(currency);
    }
  }
  function reverse() {
    setReceipt(null);
    setFrom(toCurrency);
    setTo(fromCurrency);
    if (valid) setAmount(output);
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!valid || submitLock.current) return;
    submitLock.current = true;
    const snapshot = { from: fromCurrency, to: toCurrency, amount, output };
    setReceipt(null);
    setSubmitting(true);
    submitTimer.current = window.setTimeout(() => {
      setReceipt(snapshot);
      setSubmitting(false);
      submitLock.current = false;
    }, 1000);
  }
  const oldestDate =
    from && to
      ? new Date(Math.min(Date.parse(from.date), Date.parse(to.date)))
          .toISOString()
          .slice(0, 10)
      : "";
  return (
    <div className="shell">
      <header className="site-header">
        <a href="./" className="brand" aria-label="Code challenge home">
          <span className="brand-mark">◒</span> Code challenge
        </a>
        <span className="header-label">Problem 2: Fancy Form</span>
        <span className="demo-badge">
          <span />
          Demo mode
        </span>
      </header>
      <main>
        <section className="intro">
          <div className="eyebrow">
            <span className="intro-symbol">✦</span> CURRENCY SWAP FORM
          </div>
          <h1>
            Currency
            <br /> <span>swap form.</span>
          </h1>
          <p>
            Swap assets from one currency
            <br className="desktop-break" /> to another.
          </p>
          <div className="feature">
            <span>↗</span>
            <div>
              <strong>Input validation</strong>
              <p>Validation and error messages.</p>
            </div>
          </div>
          <div className="feature">
            <span>◎</span>
            <div>
              <strong>Token prices</strong>
              <p>Token price information and exchange rates.</p>
            </div>
          </div>
          <div className="bitcoin-art" aria-hidden="true">
            <img className="bitcoin-token" src={bitcoinImage} alt="" />
            <span className="art-caption">PROBLEM 2: FANCY FORM</span>
          </div>
        </section>
        <section className="swap-area" aria-labelledby="swap-title">
          <div className="card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">FANCY FORM</span>
                <h2 id="swap-title">Swap</h2>
              </div>
              <span className="heading-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 7h11" />
                  <path d="m15 4 3 3-3 3" />
                  <path d="M17 17H6" />
                  <path d="m9 20-3-3 3-3" />
                </svg>
              </span>
            </div>
            <p className="card-subtitle">Select currencies and enter an amount.</p>
            <form onSubmit={submit} noValidate>
              <div
                className={`amount-panel ${touched && validation ? "invalid" : ""}`}
              >
                <label htmlFor="input-amount">Amount to send</label>
                <div className="amount-row">
                  <input
                    id="input-amount"
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    value={amount}
                    disabled={submitting}
                    aria-invalid={touched && !!validation}
                    aria-describedby="amount-help"
                    onBlur={() => setTouched(true)}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setReceipt(null);
                    }}
                  />
                  <TokenPicker
                    label="Send token"
                    selected={from}
                    tokens={tokens}
                    disabled={disabled}
                    onSelect={(currency) => select("from", currency)}
                  />
                </div>
                <div className="panel-foot">
                  <span>
                    {!inputError && from
                      ? `≈ ${dollars(amount, from.price)}`
                      : "Enter a token amount"}
                  </span>
                  <span>Amount to send</span>
                </div>
              </div>
              <div className="reverse-row">
                <button
                  className="reverse-button"
                  type="button"
                  disabled={disabled}
                  aria-label="Reverse swap direction"
                  onClick={reverse}
                >
                  ↓↑
                </button>
              </div>
              <div className="amount-panel receive-panel">
                <label htmlFor="output-amount">
                  Amount to receive <span>estimated</span>
                </label>
                <div className="amount-row">
                  <input
                    id="output-amount"
                    value={ready ? output || "0" : "—"}
                    readOnly
                    aria-label="Estimated amount to receive"
                  />
                  <TokenPicker
                    label="Receive token"
                    selected={to}
                    tokens={tokens}
                    disabled={disabled}
                    onSelect={(currency) => select("to", currency)}
                  />
                </div>
                <div className="panel-foot">
                  <span>
                    {output && to
                      ? `≈ ${dollars(output, to.price)}`
                      : "Your quote will appear here"}
                  </span>
                  <span>Estimated amount</span>
                </div>
              </div>
              <div id="amount-help" className="validation" aria-live="polite">
                {touched && validation ? validation : "\u00a0"}
              </div>
              <div className="rate-row">
                <span>Exchange rate</span>
                <strong>
                  {ready && from && to
                    ? `1 ${from.currency} ≈ ${rate(from, to)} ${to.currency}`
                    : "Waiting for prices…"}
                </strong>
              </div>
              <button
                className="submit-button"
                type="submit"
                disabled={!valid || submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner" />
                    Simulating swap…
                  </>
                ) : (
                  <>
                    <span>Confirm swap</span>
                    <span aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </span>
                  </>
                )}
              </button>
              <p className="demo-note">
                Simulation only. No wallet or real funds required.
              </p>
            </form>
            {receipt && (
              <div className="receipt" role="status">
                <strong>✓ Demo swap complete</strong>
                <p>
                  {receipt.amount} {receipt.from} → {receipt.output}{" "}
                  {receipt.to}
                </p>
                <span>This was a simulation; no assets were moved.</span>
              </div>
            )}
            {status === "loading" && (
              <div className="data-notice" role="status">
                <span className="spinner dark" /> Loading price information…
              </div>
            )}
            {status === "error" && (
              <div className="data-notice error" role="alert">
                <strong>Couldn't load prices</strong>
                <p>{error}</p>
                <div className="notice-actions">
                  <button type="button" onClick={retry}>
                    Try again
                  </button>
                  <button type="button" onClick={useSample}>
                    Use sample prices
                  </button>
                </div>
              </div>
            )}
            {ready && (
              <div className="price-note">
                <span className="status-dot" />
                <span>
                  {mode === "sample" ? "Sample prices" : "Price information"} ·{" "}
                  {oldestDate}
                </span>
                <button type="button" disabled={submitting} onClick={retry}>
                  {mode === "sample" ? "Load API prices" : "Refresh"}
                </button>
              </div>
            )}
          </div>
          <div className="below-card">
            <span aria-hidden="true">◇</span> Only tokens with a price are available.
          </div>
        </section>
        <section className="asset-strip" aria-label="Available assets">
          <div>
            <span className="eyebrow">TOKEN IMAGES</span>
            <p>
              {tokens.length
                ? `${tokens.length} priced tokens available`
                : "Currencies with price information"}
            </p>
          </div>
          <div className="asset-chips">
            {(tokens.length
              ? ["BTC", "ETH", "USDC", "ATOM"]
                  .map((c) => tokens.find((t) => t.currency === c))
                  .filter((t) => !!t)
                  .slice(0, 4)
              : []
            ).map((t) => (
              <span key={t.currency}>
                <TokenIcon currency={t.currency} />
                {t.currency}
              </span>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <span>Code challenge / Problem 2: Fancy Form</span>
        <span>Frontend development and design</span>
      </footer>
    </div>
  );
}
