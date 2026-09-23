"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceHistoryEntry {
  date: string; // ISO date or formatted date
  price: number;
}

interface PriceChartProps {
  data: PriceHistoryEntry[];
}

export default function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-500">
        Нет данных об истории цен
      </div>
    );
  }

  // Format the data dates for display
  const formattedData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="w-full h-[300px] p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4">Динамика изменения цены</h3>
      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12, fill: '#71717a' }} 
              axisLine={false} 
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#71717a' }} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(value) => `${value} ₸`}
              width={60}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value) => [`${String(value)} ₸`, 'Цена']}
              labelStyle={{ color: '#71717a', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#2563eb" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
              activeDot={{ r: 6, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
