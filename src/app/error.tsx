"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("MedService page error", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-white border border-black/5 shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Что-то пошло не так</h2>
        <p className="text-sm text-muted-foreground mb-6">Попробуйте обновить страницу. Ваши данные не были удалены.</p>
        <Button onClick={() => reset()}>Повторить</Button>
      </div>
    </div>
  );
}
