"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Search, User, ClipboardList, Inbox, Loader2 } from "lucide-react";
import { globalSearchAction } from "@/server/actions/search";
import type { GlobalSearchResult } from "@/server/services/global-search";

type CommandPaletteContextValue = {
  open: () => void;
  close: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setVisible((v) => !v);
      }
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, close }}>
      {children}
      <CommandPalette open={visible} onClose={close} />
    </CommandPaletteContext.Provider>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        const next = await globalSearchAction(query);
        setResults(next);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/40 px-4 pt-[12vh] backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close search" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-ink-200"
      >
        <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
          <Search className="size-4 shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, jobs, bookings…"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
          {pending && <Loader2 className="size-4 animate-spin text-ink-400" />}
          <kbd className="hidden rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 sm:inline">
            esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {query.trim().length < 2 ? (
            <li className="px-4 py-6 text-center text-sm text-ink-500">Type at least 2 characters</li>
          ) : results.length === 0 && !pending ? (
            <li className="px-4 py-6 text-center text-sm text-ink-500">No results for &ldquo;{query}&rdquo;</li>
          ) : (
            results.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-ink-50"
                  onClick={() => {
                    onClose();
                    router.push(r.href);
                  }}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    {r.type === "customer" ? (
                      <User className="size-4" />
                    ) : r.type === "job" ? (
                      <ClipboardList className="size-4" />
                    ) : (
                      <Inbox className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink-950">{r.label}</span>
                    <span className="block truncate text-xs capitalize text-ink-500">
                      {r.type} · {r.sublabel}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
