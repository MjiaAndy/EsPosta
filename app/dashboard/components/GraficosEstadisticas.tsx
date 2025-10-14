'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import {StatData} from '@/types'
import type {RawStat} from '@/types'

export function GraficosEstadisticas() {
  const [data, setData] = useState<StatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('Formato inesperado de /api/stats');

      const sanitized = (json as unknown[]).map((item) => {
        const it = item as RawStat;
        const date = typeof it.date === 'string' ? it.date : String(it.date ?? '');
        const count = typeof it.count === 'number' ? it.count : Number(it.count ?? 0);
        return { date, count };
      });
      setData(sanitized);
    } catch (err: unknown) {
      console.error('Error al obtener estadísticas:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };
  fetchStats();
}, []);

  useEffect(() => {
    setTimeout(() => {
      const container = document.querySelector('#chart-root');
      if (!container) return console.debug('chart-root no encontrado');
      console.debug('chart-root computed height:', getComputedStyle(container).height);
      const svg = container.querySelector('svg');
      console.debug('SVG exists?', !!svg, svg);
    }, 300); 
  }, [data, isLoading]);

  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-foreground-strong">Actividad de Verificación</h2>

      <div id="chart-root" className="w-full bg-background-alt/60 p-4 rounded-2xl border border-white/10">
        {isLoading && (
          <div className="min-h-[220px] flex items-center justify-center">
            <div className="h-36 w-full rounded-lg bg-white/5 animate-pulse" />
          </div>
        )}

        {!isLoading && error && (
          <div className="min-h-[160px] flex items-center justify-center text-sm text-red-400">{error}</div>
        )}

        {!isLoading && !error && data.length === 0 && (
          <div className="min-h-[160px] flex items-center justify-center text-sm text-foreground">Aún no hay datos de actividad.</div>
        )}

        {!isLoading && !error && data.length > 0 && (
          <div className="w-full" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart key={JSON.stringify(data)} data={data}>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                <Tooltip cursor={{ fill: 'rgba(99,102,241,0.12)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155' }} />
                <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} name="Verificaciones" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.section>
  );
}
