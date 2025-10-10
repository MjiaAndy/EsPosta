import { useState, useEffect } from 'react';
import type { Verification } from '@prisma/client'; 

export function HistorialReciente() {
  const [history, setHistory] = useState<Verification[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/history')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setHistory(data);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div className="text-sm text-center text-foreground">Cargando historial...</div>;
  }
  if (!history || history.length === 0) {
    return <div className="text-sm text-center text-foreground">No hay verificaciones recientes.</div>;
  }
  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <h3 className="font-semibold text-foreground-strong mb-2">Historial Reciente</h3>
      <ul className="space-y-2">
        {history.map((item) => (
          <li key={item.id} className="text-sm text-foreground truncate">
            <a href={item.url ?? '#'} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              {item.title || 'Verificación sin título'}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}