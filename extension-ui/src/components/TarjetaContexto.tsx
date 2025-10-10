'use client';
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BookText } from 'lucide-react';
import { TarjetaContextoProps } from '../../../types'

export const TarjetaContexto = memo(function TarjetaContexto({ context }: TarjetaContextoProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Contexto Adicional</CardTitle>
        <BookText className="h-4 w-4 text-foreground-alt" />
      </CardHeader>
      <CardContent>
        <p className="text-sm">{context}</p>
      </CardContent>
    </Card>
  );
});