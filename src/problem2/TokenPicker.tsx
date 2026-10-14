import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Token } from "./domain.ts";
import { TokenIcon } from "./TokenIcon.tsx";
export function TokenPicker({
  label,
  selected,
  tokens,
  disabled,
  onSelect,
}: {
  label: string;
  selected: Token | undefined;
  tokens: Token[];
  disabled: boolean;
  onSelect: (currency: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wasOpen = useRef(false);
  const listId = useId();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const filtered = tokens.filter((t) =>
    t.currency.toLowerCase().includes(search.toLowerCase()),
  );
  const active =
    filtered.length === 0 ? -1 : Math.min(activeIndex, filtered.length - 1);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open) {
      wasOpen.current = true;
      if (!node.open) node.showModal();
      searchRef.current?.focus();
      return;
    }
    if (node.open) node.close();
    if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);
  function choose(currency: string) {
    onSelect(currency);
    setSearch("");
    setOpen(false);
  }
  function scrollOptionIntoView(option: HTMLElement) {
    const list = option.closest(".token-list");
    if (!(list instanceof HTMLElement)) return;
    const listRect = list.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();
    if (optionRect.top < listRect.top)
      list.scrollTop -= listRect.top - optionRect.top;
    else if (optionRect.bottom > listRect.bottom)
      list.scrollTop += optionRect.bottom - listRect.bottom;
  }
  function focusOption(index: number) {
    setActiveIndex(index);
    const option = optionRefs.current[index];
    if (!option) return;
    option.focus();
    scrollOptionIntoView(option);
  }
  useEffect(() => {
    if (!open || active < 0) return;
    const option = optionRefs.current[active];
    if (option) scrollOptionIntoView(option);
  }, [open, active]);
  function onDialogKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    const count = filtered.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!count) return;
      const current = optionRefs.current.findIndex(
        (node) => node === document.activeElement,
      );
      if (current === -1) {
        const start = Math.min(Math.max(activeIndex, 0), count - 1);
        if (e.key === "ArrowUp") {
          if (start > 0) focusOption(start - 1);
          return;
        }
        focusOption(Math.min(start + 1, count - 1));
        return;
      }
      if (e.key === "ArrowDown") {
        if (current + 1 < count) focusOption(current + 1);
        return;
      }
      if (current === 0) searchRef.current?.focus();
      else focusOption(current - 1);
      return;
    }
    if (
      (e.key === "Home" || e.key === "End") &&
      e.target !== searchRef.current
    ) {
      e.preventDefault();
      if (count) focusOption(e.key === "Home" ? 0 : count - 1);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Enter" && e.target === searchRef.current) {
      e.preventDefault();
      const token = filtered[active];
      if (token) choose(token.currency);
      return;
    }
    if (
      e.target !== searchRef.current &&
      e.key === "Backspace" &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      setSearch((value) => value.slice(0, -1));
      setActiveIndex(0);
      searchRef.current?.focus();
      return;
    }
    if (
      e.target !== searchRef.current &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      setSearch((value) => value + e.key);
      setActiveIndex(0);
      searchRef.current?.focus();
    }
  }
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="token-button"
        aria-label={`${label}: ${selected?.currency ?? "Select token"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          const index = tokens.findIndex(
            (token) => token.currency === selected?.currency,
          );
          setSearch("");
          setActiveIndex(index >= 0 ? index : 0);
          setOpen(true);
        }}
      >
        {selected && (
          <TokenIcon key={selected.currency} currency={selected.currency} />
        )}
        <span>{selected?.currency ?? "Select"}</span>
      </button>
      <dialog
        ref={dialog}
        className="token-dialog"
        aria-label={`Select ${label.toLowerCase()}`}
        onKeyDown={onDialogKeyDown}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) {
            const rect = dialog.current.getBoundingClientRect();
            if (
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom
            )
              setOpen(false);
          }
        }}
      >
        <div className="dialog-title">
          <h2>Select a token</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close token picker"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <label className="sr-only" htmlFor={`${label}-search`}>
          Search tokens
        </label>
        <input
          ref={searchRef}
          id={`${label}-search`}
          className="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `${listId}-option-${active}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          placeholder="Search by symbol…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveIndex(0);
          }}
        />
        <div
          id={listId}
          className="token-list"
          role="listbox"
          aria-label="Tokens"
        >
          {filtered.map((t, i) => (
            <button
              type="button"
              key={t.currency}
              id={`${listId}-option-${i}`}
              ref={(node) => {
                optionRefs.current[i] = node;
              }}
              className={`token-option${i === active ? " is-active" : ""}`}
              role="option"
              tabIndex={-1}
              aria-selected={i === active}
              onClick={() => choose(t.currency)}
              onFocus={() => setActiveIndex(i)}
            >
              <TokenIcon currency={t.currency} />
              <strong>{t.currency}</strong>
              <span>
                {selected?.currency === t.currency ? "Selected ✓" : "Select"}
              </span>
            </button>
          ))}
          {!filtered.length && (
            <p className="empty">No tokens match “{search}”.</p>
          )}
        </div>
        <p className="dialog-note">
          Only tokens with a valid price are available.
        </p>
      </dialog>
    </>
  );
}
