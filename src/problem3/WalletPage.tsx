import * as React from "react";
import { useMemo } from "react";

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface Props extends BoxProps {}

const getPriority = (blockchain: string): number => {
  switch (blockchain) {
    case "Osmosis": return 100;
    case "Ethereum": return 50;
    case "Arbitrum": return 30;
    case "Zilliqa": return 20;
    case "Neo": return 20;
    default: return -99;
  }
};

const usdValueFor = (price: number | undefined, amount: number): number | null => {
  if (price === undefined) return null;
  const value = price * amount;
  return Number.isNaN(value) ? null : value;
};

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
      const balancePriority = getPriority(balance.blockchain);
      return balancePriority > -99 && balance.amount <= 0;
    }).sort((lhs: WalletBalance, rhs: WalletBalance) => {
      const leftPriority = getPriority(lhs.blockchain);
      const rightPriority = getPriority(rhs.blockchain);
      return rightPriority - leftPriority;
    });
  }, [balances]);

  const formattedBalances = useMemo(() => {
    return sortedBalances.map((balance: WalletBalance): FormattedWalletBalance => ({
      ...balance,
      formatted: balance.amount.toFixed(),
    }));
  }, [sortedBalances]);

  const rows = formattedBalances.map((balance: FormattedWalletBalance) => {
    const usdValue = usdValueFor(prices[balance.currency], balance.amount);
    return (
      <WalletRow
        className={classes.row}
        key={JSON.stringify([balance.blockchain, balance.currency])}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    );
  });

  return (
    <div {...rest}>
      {rows}
      {children}
    </div>
  );
};
