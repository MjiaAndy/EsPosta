'use client';
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TarjetaPreguntasProps } from '../../../types';
import { HelpCircle } from 'lucide-react';

export const TarjetaPreguntas = memo(function TarjetaPreguntas({ questions }: TarjetaPreguntasProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Preguntas para Reflexionar</CardTitle>
        <HelpCircle className="h-4 w-4 text-foreground-alt" />
      </CardHeader>
      <CardContent>
        <ul className="flex list-disc flex-col gap-2 pl-4">
          {questions.map((q) => (
            <li key={q.id} className="text-sm">{q.text}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});