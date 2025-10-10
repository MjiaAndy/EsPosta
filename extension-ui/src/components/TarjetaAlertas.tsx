'use client';
import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TarjetaAlertasProps } from '../../../types';
import { AlertTriangle, ChevronDown } from 'lucide-react';

export const TarjetaAlertas = memo(function TarjetaAlertas({ alerts }: TarjetaAlertasProps) {
const [isOpen, setIsOpen] = useState(true);

if (alerts.length === 0) return null;

return (
    <Card>
    <CardHeader>
        <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
        >
        <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" />
            <CardTitle>{alerts.length} Señal{alerts.length > 1 ? 'es' : ''} de Alerta</CardTitle>
        </div>
        <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-5 w-5" />
        </motion.div>
        </button>
    </CardHeader>
    <AnimatePresence>
        {isOpen && (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
        >
            <CardContent className="pt-0">
            <ul className="flex flex-col gap-3 pl-1">
                {alerts.map((alert) => (
                <li key={alert.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
                    <span>{alert.text}</span>
                </li>
                ))}
            </ul>
            </CardContent>
        </motion.div>
        )}
    </AnimatePresence>
    </Card>
);
});