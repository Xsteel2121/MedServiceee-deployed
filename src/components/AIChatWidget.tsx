"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { API_URL } from "@/lib/api";
import { useTranslation } from "@/i18n/LanguageContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RecommendedDoctor {
  id: string;
  name: string;
  specialty: string;
  clinic_id: string;
  clinic_name?: string | null;
  price: number;
  rating?: number | null;
}

export function AIChatWidget() {
  const { locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Сәлеметсіз бе! Мен сіздің AI-көмекшіңізбін 🤖\n\nСізге ең жақсы клиника мен дәрігерді тауып бере аламын. Сұрағыңызды қоя беріңіз:\n\nМысалы:\n- *Какое УЗИ самое лучшее по цене и качеству в Алматы?*\n- *Где принимает врач Абишев?*\n- *Қай клиникада қан тапсыру арзан?*"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedDoctors, setRecommendedDoctors] = useState<RecommendedDoctor[]>([]);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [aiSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    const existing = window.localStorage.getItem("medservice-ai-session");
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem("medservice-ai-session", created);
    return created;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-AI-Session": aiSessionId },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json().catch(() => ({})) as {
        reply?: string;
        recommended_doctors?: RecommendedDoctor[];
        detail?: { message?: string; upgrade_required?: boolean } | string;
      };
      if (!res.ok) {
        if (res.status === 429 && typeof data.detail === "object" && data.detail?.upgrade_required) {
          setShowQuotaModal(true);
          setIsOpen(true);
        }
        const detail = typeof data.detail === "string" ? data.detail : data.detail?.message;
        throw new Error(detail || "Chat request failed");
      }
      setRecommendedDoctors(data.recommended_doctors || []);

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
         content: data.reply || (locale === "kk" ? "Сұрағыңызға жауап табылмады." : "Не удалось найти ответ на ваш вопрос.")
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: locale === "kk" ? "Қате кетті. Бэкендтің қосылғанын тексеріңіз." : "Произошла ошибка. Проверьте, что backend запущен."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInlineMarkdown = (content: string): ReactNode[] => {
    const tokenPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\)]+\))/g;
    const nodes: ReactNode[] = [];
    let cursor = 0;

    for (const match of content.matchAll(tokenPattern)) {
      const token = match[0];
      const start = match.index ?? 0;
      if (start > cursor) nodes.push(content.slice(cursor, start));

      if (token.startsWith("**")) {
        nodes.push(<strong key={`${start}-bold`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("*")) {
        nodes.push(<em key={`${start}-italic`}>{token.slice(1, -1)}</em>);
      } else {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
        const href = linkMatch?.[2] ?? "#";
        const isSafeHref = href.startsWith("/") || href.startsWith("https://");
        nodes.push(isSafeHref ? (
          <a key={`${start}-link`} href={href} className="text-primary underline font-semibold hover:text-blue-700 transition-colors">
            {linkMatch?.[1]}
          </a>
        ) : (linkMatch?.[1] ?? token));
      }
      cursor = start + token.length;
    }

    if (cursor < content.length) nodes.push(content.slice(cursor));
    return nodes;
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split("\n");
    return parts.map((part, index) => (
      <span key={index}>
        {renderInlineMarkdown(part)}
        {index < parts.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
        >
          {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
        </button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] h-[600px] max-h-[80vh] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col z-50"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">MedService AI</h3>
                  <p className="text-xs text-white/70">Умный ассистент по клиникам</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white shadow-sm border border-black/5 rounded-tl-sm text-foreground'}`}>
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              ))}
              {recommendedDoctors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{locale === "kk" ? "Ұсынылған дәрігерлер" : "Рекомендуемые врачи"}</p>
                  {recommendedDoctors.map((doctor) => (
                    <div key={doctor.id} className="bg-white shadow-sm border border-black/5 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{doctor.name}</p>
                          <p className="text-xs text-primary">{doctor.specialty}</p>
                          <p className="text-xs text-muted-foreground">{doctor.clinic_name || "Клиника"} · {doctor.price.toLocaleString("ru-RU")} ₸ · ★ {doctor.rating ?? "—"}</p>
                        </div>
                        <a href={`/clinics/${encodeURIComponent(doctor.clinic_id)}`} className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                          {locale === "kk" ? "Жазылу" : "Записаться"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl text-sm bg-white shadow-sm border border-black/5 rounded-tl-sm text-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" /> AI думает...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-black/5">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Спросите что-нибудь..."
                  className="flex-1 bg-black/5 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showQuotaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowQuotaModal(false)}
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <h3 className="text-lg font-bold mb-2">{locale === "kk" ? "AI лимиті аяқталды" : "Лимит AI исчерпан"}</h3>
              <p className="text-sm text-muted-foreground mb-5">{locale === "kk" ? "Шексіз қолжетімділік үшін Pro немесе Premium жоспарын таңдаңыз." : "Для безлимитного доступа выберите тариф Pro или Premium."}</p>
              <div className="flex gap-2">
                <a href="/promotions" className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primary/90">{locale === "kk" ? "Жоспарларды көру" : "Выбрать тариф"}</a>
                <button type="button" onClick={() => setShowQuotaModal(false)} className="rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold">{locale === "kk" ? "Жабу" : "Закрыть"}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
