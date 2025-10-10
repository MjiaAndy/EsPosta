import React from 'react';
import { getVerifications } from '@/app/actions';
import { PaginationControls } from './PaginationControls';
import {HistorialVerificacionesProps} from '@/types'

export async function HistorialVerificaciones({ page }: HistorialVerificacionesProps) {
  const { verifications, total, error } = await getVerifications(page);

  if (error) {
    return <p className="text-danger">Error: {error}</p>;
  }

  const ITEMS_PER_PAGE = 10;
  const hasNextPage = page * ITEMS_PER_PAGE < total;
  const hasPrevPage = page > 1;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-foreground-strong">Historial de Verificaciones</h2>
      <div className="bg-background-alt/60 rounded-lg border border-white/10">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="p-4 text-sm font-semibold text-foreground">Título</th>
              <th className="p-4 text-sm font-semibold text-foreground hidden sm:table-cell">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((v) => (
              <tr key={v.id} className="border-b border-white/10 last:border-b-0">
                <td className="p-4 text-sm text-foreground-strong truncate max-w-xs">
                  <a href={v.url ?? '#'} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {v.title || "Análisis sin título"}
                  </a>
                </td>
                <td className="p-4 text-sm text-foreground hidden sm:table-cell">
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />
    </div>
  );
}