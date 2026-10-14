# Problem 3 — Messy React

## Issues and refactors


| Issue                                                                                   | Consequence                                                                                                            | Refactor                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| The filter references undeclared `lhsPriority`, instead of its local `balancePriority`. | Compilation error; ReferenceError if type checking is bypassed.                                                        | Use the current balance's priority.                                                                                       |
| `WalletBalance` has no `blockchain`, despite accessing it.                              | TypeScript's declared shape does not match usage.                                                                      | Add `blockchain: string`, which the existing code already requires.                                                       |
| `getPriority` accepts `any` and is declared inside the component.                       | Loses type checking and allocates a new helper every render; a local helper also complicates memo dependency analysis. | Type its argument as string and move the static helper outside.                                                           |
| Sorting memo depends on `prices`, but never uses them.                                  | Price updates repeat filtering and sorting.                                                                            | Depend on balances only. Row valuation remains outside the memo and updates with prices.                                  |
| The sort comparator does not explicitly return 0 on ties.                               | Incomplete comparator contract. `undefined` behaves like a tie at runtime; it does not prove that every sort fails.    | Subtract priorities to return negative, positive or zero.                                                                 |
| `formattedBalances` creates an unused array and objects on every render.                | Wasted O(m) work and allocations; formatting is not passed to rows.                                                    | Keep `formattedBalances`, memoize it against `sortedBalances`, and use it when building rows.                             |
| Row mapping uses `sortedBalances` but annotates its items as `FormattedWalletBalance`.  | The annotation does not create `formatted`; it is undefined at runtime and incompatible under strict typing.           | Map `formattedBalances`, using `FormattedWalletBalance` and its actual `formatted` field.                                 |
| Index keys on a sorted/filtered list.                                                   | React can associate component state with a different balance after list changes.                                       | Use a stable blockchain/currency key under the uniqueness assumption below.                                               |
| `children` is extracted but never rendered.                                             | Children supplied through Props are silently discarded.                                                                | Render children in the container. This is an explicit correction to the component's children handling.                    |
| Missing prices make `prices[currency] * amount` NaN.                                    | `WalletRow` receives NaN (`undefined * amount`, and `Infinity * 0`).                                                   | Keep the same product for every non-NaN result, including zero. Pass `null` when the product is NaN. Do not substitute 0. |




## Refactoring notes

- `amount <= 0` retains zero and negative balances. This may be unintended for a holdings screen, but the question does not specify that business rule. The refactor **preserves it**.
- `toFixed()` defaults to zero decimal places. This rounds fractional holdings. The refactor preserves the original formatting instead of choosing an arbitrary precision.
- A missing price makes the original valuation NaN. `usdValueFor` returns `null` for that missing price, and returns `null` when `price * amount` is NaN. Zero, negative, and other finite products stay unchanged. `null` means the price is unavailable; it is not a zero balance. `WalletRow` must render that unavailable state.
- BoxProps, hooks, WalletRow and classes are host dependencies omitted from the problem3. Their absence in the excerpt is not itself evidence of an anti-pattern. BoxProps may contain props unsuitable for a native div; inspect its actual definition before changing the container or public props contract.
- `filter(...).sort(...)` sorts a newly allocated array and **does not mutate the original balances**.
- Prices must cause a render and balances must use immutable updates for the memo to stay current. No evidence warrants adding useCallback or memoizing every WalletRow.

