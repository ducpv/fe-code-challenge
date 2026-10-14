import Decimal from "decimal.js";
const Money = Decimal.clone({ precision: 80, rounding: Decimal.ROUND_DOWN });
export const PRICE_URL = "https://interview.switcheo.com/prices.json";
export interface Token {
  currency: string;
  price: string;
  date: string;
}
export const SAMPLE_TOKENS: Token[] = [
  { currency: "USDC", price: "1", date: "2023-08-29T07:10:00Z" },
  { currency: "ETH", price: "1645.93", date: "2023-08-29T07:10:00Z" },
  { currency: "BTC", price: "26002.82", date: "2023-08-29T07:10:00Z" },
  { currency: "SWTH", price: "0.00404", date: "2023-08-29T07:10:00Z" },
  {
    currency: "ATOM",
    price: "7.186657333333334",
    date: "2023-08-29T07:10:00Z",
  },
];

export function normalizePrices(data: unknown): Token[] {
  if (!Array.isArray(data))
    throw new Error("The price service returned an invalid response.");
  const tokens = new Map<string, Token>();
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const { currency, price, date } = item as Record<string, unknown>;
    if (
      typeof currency !== "string" ||
      !/^[A-Za-z0-9._-]{1,32}$/.test(currency)
    )
      continue;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0)
      continue;
    if (typeof date !== "string" || !Number.isFinite(Date.parse(date)))
      continue;
    const previous = tokens.get(currency);
    if (!previous || Date.parse(date) > Date.parse(previous.date)) {
      tokens.set(currency, { currency, price: String(price), date });
    }
  }
  if (tokens.size < 2)
    throw new Error("At least two currencies with valid prices are required.");
  return [...tokens.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );
}
export function amountError(value: string): string | null {
  if (!value.trim()) return "Enter an amount to get a quote.";
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))
    return "Use a positive number, for example 100.50.";
  const [whole = "", fraction = ""] = value.split(".");
  if (whole.length > 18 || fraction.length > 18)
    return "Use up to 18 digits before and after the decimal point.";
  if (!new Money(value).gt(0)) return "The amount must be greater than zero.";
  return null;
}
export function quote(amount: string, from: Token, to: Token): string {
  if (amountError(amount)) throw new Error("Invalid amount.");
  const fromPrice = new Money(from.price);
  const toPrice = new Money(to.price);
  if (
    !fromPrice.isFinite() ||
    !toPrice.isFinite() ||
    !fromPrice.gt(0) ||
    !toPrice.gt(0)
  )
    throw new Error("Invalid price.");
  return new Money(amount)
    .mul(fromPrice)
    .div(toPrice)
    .toDecimalPlaces(18)
    .toFixed();
}
export function dollars(amount: string, price: string): string {
  return new Money(amount)
    .mul(price)
    .toDecimalPlaces(2)
    .toNumber()
    .toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
}
export function rate(from: Token, to: Token): string {
  return new Money(from.price).div(to.price).toSignificantDigits(8).toFixed();
}
