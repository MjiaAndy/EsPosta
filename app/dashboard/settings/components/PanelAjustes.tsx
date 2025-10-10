'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { TrustedSource } from '@prisma/client';

export function PanelAjustes() {
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [newSource, setNewSource] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trusted-sources').then(res => res.json()).then(data => {
      setSources(data);
      setIsLoading(false);
    });
  }, []);

  const addSource = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/trusted-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: newSource }),
    });
    if (res.ok) {
      const added = await res.json();
      setSources([...sources, added]);
      setNewSource('');
    }
  };

  const deleteSource = async (id: string) => {
    await fetch('/api/trusted-sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSources(sources.filter(s => s.id !== id));
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-foreground-strong">Fuentes Confiables</h2>
      <form onSubmit={addSource} className="flex gap-2">
        <input
          type="text"
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          placeholder="ej. nytimes.com"
          className="flex-grow p-2 rounded-md bg-background-alt border border-white/10"
        />
        <button type="submit" className="bg-primary text-white font-semibold p-2 px-4 rounded-md">Añadir</button>
      </form>
      <div className="mt-4 space-y-2">
        {isLoading ? <p>Cargando...</p> : sources.map(source => (
          <div key={source.id} className="flex justify-between items-center p-2 bg-background-alt/60 rounded-md">
            <span className="font-mono">{source.domain}</span>
            <button onClick={() => deleteSource(source.id)} className="text-foreground hover:text-danger">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}