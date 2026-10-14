import { useState } from "react";
export function TokenIcon({ currency }: { currency: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="token-icon" aria-hidden="true">
      {failed ? (
        currency.slice(0, 1)
      ) : (
        <img
          alt=""
          src={`https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${encodeURIComponent(currency)}.svg`}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
