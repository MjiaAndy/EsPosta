'use client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function Loader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-semibold text-foreground-strong">Analizando contenido...</p>
      <p className="text-sm text-foreground">
        Consultando fuentes y buscando inconsistencias. Esto puede tardar unos segundos.
      </p>
    </motion.div>
  );
}