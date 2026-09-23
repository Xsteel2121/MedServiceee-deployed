"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, CircleDollarSign, FileText, History, Lightbulb, MapPin, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

type NodeId = "target" | "price" | "quality" | "location" | "history" | "risk" | "recommendation";

const nodes: Array<{ id: NodeId; label: string; detail: string; icon: typeof Activity; tone: string; x: string; y: string }> = [
  { id: "target", label: "Предложение", detail: "Выбранная медицинская услуга и конкретная клиника.", icon: Activity, tone: "bg-primary text-white", x: "50%", y: "48%" },
  { id: "price", label: "Цена", detail: "Сравнение стоимости активного предложения с другими клиниками.", icon: CircleDollarSign, tone: "bg-green-100 text-green-700", x: "16%", y: "20%" },
  { id: "quality", label: "Качество", detail: "Рейтинг клиники и количество отзывов из каталога.", icon: ShieldCheck, tone: "bg-sky-100 text-sky-700", x: "84%", y: "20%" },
  { id: "location", label: "Локация", detail: "Город, адрес и координаты филиала.", icon: MapPin, tone: "bg-amber-100 text-amber-700", x: "15%", y: "76%" },
  { id: "history", label: "История", detail: "Дата обновления цены и доступная история изменения.", icon: History, tone: "bg-slate-100 text-slate-700", x: "85%", y: "76%" },
  { id: "risk", label: "Сигнал", detail: "Если цена устарела или источник недоступен, это нужно проверить.", icon: AlertTriangle, tone: "bg-red-100 text-red-700", x: "50%", y: "10%" },
  { id: "recommendation", label: "Рекомендация", detail: "Решение опирается на цену, качество, свежесть и расположение.", icon: Lightbulb, tone: "bg-primary/10 text-primary", x: "50%", y: "86%" },
];

export function DecisionMap() {
  const [selected, setSelected] = useState<NodeId>("target");
  const selectedNode = nodes.find((node) => node.id === selected) ?? nodes[0];
  const SelectedIcon = selectedNode.icon;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <GlassCard className="relative min-h-[560px] overflow-hidden bg-white/80 p-4 md:p-8">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(rgba(15,111,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,111,255,.06) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative h-[500px]">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {nodes.filter((node) => node.id !== "target").map((node) => <line key={node.id} x1="50" y1="48" x2={parseFloat(node.x)} y2={parseFloat(node.y)} stroke="rgba(15,111,255,.22)" strokeWidth=".35" strokeDasharray="1.5 1.5" />)}
          </svg>
          {nodes.map((node) => {
            const Icon = node.icon;
            const isSelected = selected === node.id;
            return <motion.button key={node.id} type="button" onClick={() => setSelected(node.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: .97 }} className={`focus-ring absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 ${isSelected ? "z-20" : "z-10"}`} style={{ left: node.x, top: node.y }} aria-label={`Открыть ${node.label}`}>
              <span className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white shadow-lg ${node.tone} ${isSelected ? "ring-4 ring-primary/20" : ""}`}><Icon className="h-6 w-6" /></span>
              <span className="whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">{node.label}</span>
            </motion.button>;
          })}
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Explainable analysis</p><h2 className="mt-2 text-2xl font-bold">{selectedNode.label}</h2></div><span className="rounded-xl bg-primary/10 p-3 text-primary"><SelectedIcon className="h-5 w-5" /></span></div>
          <p className="text-sm leading-6 text-muted-foreground">{selectedNode.detail}</p>
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            {[{ label: "Signal", icon: Activity }, { label: "Evidence", icon: FileText }, { label: "Analysis", icon: CheckCircle2 }, { label: "Impact", icon: CalendarDays }].map((step, index) => { const StepIcon = step.icon; return <div key={step.label} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-primary"><StepIcon className="h-4 w-4" /></span><span className="text-sm font-medium">{step.label}</span>{index < 3 && <span className="ml-auto text-xs text-slate-400">↓</span>}</div>; })}
          </div>
        </GlassCard>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><strong>Режим демонстрации.</strong> Карта использует доступные поля каталога и не делает медицинских выводов. Сигналы требуют проверки источника и даты обновления.</div>
        <Button variant="outline" className="w-full" onClick={() => setSelected("recommendation")}><Lightbulb className="mr-2 h-4 w-4" />Показать рекомендацию</Button>
      </div>
    </div>
  );
}
