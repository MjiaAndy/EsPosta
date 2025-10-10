import { useState } from 'react';
import { motion, AnimatePresence} from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useAnalysis } from '../lib/hooks/useAnalysis';
import { Loader } from './Loader';
import { ErrorDisplay } from './ErrorDisplay';
import { TarjetaFuente } from './TarjetaFuente';
import { TarjetaAlertas } from './TarjetaAlertas';
import { TarjetaContexto } from './TarjetaContexto';
import { TarjetaPreguntas } from './TarjetaPreguntas';
import { AuthStatus, useExtensionSession } from './AuthStatus';
import { HistorialReciente } from './HistorialReciente';
import { cn } from '@/lib/utils';
import type { Tab } from '../../../types'

const containerVariants: Variants = { 
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = { 
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export function PanelAnalisis() {
  const { analysisResult, isLoading, error, source } = useAnalysis();
  const { status } = useExtensionSession();
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

  return (
    <div className="p-4 bg-background/80 backdrop-blur-xl min-h-[400px] rounded-lg flex flex-col">
      <div className="flex justify-end mb-4">
        <AuthStatus />
      </div>
      {status === 'authenticated' && (
        <div className="flex mb-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('analysis')}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'analysis' ? 'text-primary border-b-2 border-primary' : 'text-foreground hover:text-white'
            )}
          >
            Análisis Actual
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-foreground hover:text-white'
            )}
          >
            Historial
          </button>
        </div>
      )}
      <div className="flex-grow">
        {activeTab === 'analysis' && (
          <AnimatePresence mode="wait">
            {isLoading && <motion.div key="loader"><Loader /></motion.div>}
            {error && <motion.div key="error"><ErrorDisplay error={error} /></motion.div>}
            {analysisResult && (
              <motion.div key="results" variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-4">
                {source === 'cache' && <div className="text-xs text-center text-foreground/50 mb-2">Resultados cargados desde caché</div>}
                <motion.div variants={itemVariants}><TarjetaFuente source={analysisResult.source} /></motion.div>
                <motion.div variants={itemVariants}><TarjetaAlertas alerts={analysisResult.alerts} /></motion.div>
                <motion.div variants={itemVariants}><TarjetaContexto context={analysisResult.context} /></motion.div>
                <motion.div variants={itemVariants}><TarjetaPreguntas questions={analysisResult.questions} /></motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        {activeTab === 'history' && status === 'authenticated' && (
          <HistorialReciente />
        )}
      </div>
    </div>
  );
}