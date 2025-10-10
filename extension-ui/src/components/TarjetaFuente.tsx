'use client';
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TarjetaFuenteProps } from '../../../types';
import { Newspaper, MessageSquare, Flame } from 'lucide-react';

const getSourceIcon = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('noticia')) return <Newspaper className="h-4 w-4 text-foreground-alt" />;
  if (lowerType.includes('blog')) return <MessageSquare className="h-4 w-4 text-foreground-alt" />;
  return <Flame className="h-4 w-4 text-foreground-alt" />;
};

export const TarjetaFuente = memo(function TarjetaFuente({ source }: TarjetaFuenteProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Análisis de la Fuente</CardTitle>
        {getSourceIcon(source.type)}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm"><span className="font-semibold text-foreground-strong">Tipo: </span>{source.type}</p>
        <p className="text-sm"><span className="font-semibold text-foreground-strong">Sesgo: </span>{source.bias}</p>
        <p className="text-sm"><span className="font-semibold text-foreground-strong">Reputación: </span>{source.reputation}</p>
      </CardContent>
    </Card>
  );
});