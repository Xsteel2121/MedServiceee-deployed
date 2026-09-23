"use client";

import Link from "next/link";
import { ArrowLeft, Network } from "lucide-react";
import { DecisionMap } from "@/components/DecisionMap";

export default function DecisionMapPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-slate-200/70 bg-white/80 py-12 backdrop-blur-xl">
        <div className="container mx-auto max-w-[1440px] px-4">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="h-4 w-4" /> На главную</Link>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.14em] text-primary"><Network className="h-3.5 w-3.5" /> Decision Map</div><h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">Поймите, почему предложение подходит</h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Интерактивный слой над каталогом: цена, качество, история и локация собраны в одну объяснимую картину.</p></div><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">Данные каталога · демонстрационный анализ</div></div>
        </div>
      </div>
      <main className="container mx-auto max-w-[1440px] px-4 py-10"><DecisionMap /></main>
    </div>
  );
}