"use client"

import { motion } from "framer-motion"

const stats = [
  { value: "120+", label: "Клиник" },
  { value: "5000+", label: "Услуг" },
  { value: "15+", label: "Городов" },
  { value: "сегодня", label: "Обновление" },
]

export function Stats() {
  return (
    <section className="py-12 border-y border-black/5 bg-white/50">
      <div className="container mx-auto max-w-[1440px] px-4">
        <div className="flex flex-wrap justify-between items-center gap-8 md:gap-4">
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex-1 min-w-[140px] text-center"
            >
              <div className="text-3xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
