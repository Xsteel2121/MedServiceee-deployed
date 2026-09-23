"use client";

import { useEffect, useMemo, useState } from "react";
import { Command, Search } from "lucide-react";
import { useRouter } from "next/navigation";

const commands = [
  { label: "Поиск услуг", hint: "Найти анализ или диагностику", href: "/search" },
  { label: "Клиники на карте", hint: "Открыть каталог клиник", href: "/clinics" },
  { label: "Избранное", hint: "Сохранённые предложения", href: "/favorites" },
  { label: "Акции", hint: "Посмотреть специальные предложения", href: "/promotions" },
  { label: "Карта решений", hint: "Разобрать предложение по сигналам", href: "/decision-map" },
  { label: "О сервисе", hint: "Как работает MedServicePrice", href: "/about" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => commands.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/25 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Командная палитра" className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-5 w-5 text-primary" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Куда перейти?" className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
          <kbd className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">ESC</kbd>
        </div>
        <div className="p-2">
          {filtered.map((item, index) => (
            <button key={item.href} type="button" onClick={() => { setOpen(false); router.push(item.href); }} className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-primary/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Command className="h-4 w-4" /></span>
              <span className="flex-1"><span className="block text-sm font-semibold text-foreground">{item.label}</span><span className="block text-xs text-muted-foreground">{item.hint}</span></span>
              <span className="text-xs text-slate-400">{index + 1}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">Ничего не найдено</p>}
        </div>
      </div>
    </div>
  );
}
