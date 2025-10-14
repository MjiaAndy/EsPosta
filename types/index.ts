//DATA MODELS

export type VerificationDto = {
  id: string;
  userId?: string;
  createdAt?: string; 
  url?: string | null;
  title?: string | null;
  analysis?: any; 
};
export interface SourceAnalysis {
  type: string;
  bias: string;
  reputation: string;
}

export interface Alert {
  id: number;
  type: 'sensationalism' | 'unsourced_claim' | 'inconsistency';
  text: string;
}

export interface CriticalQuestion {
  id: number;
  text: string;
}

export interface AnalysisResult {
  source: SourceAnalysis;
  alerts: Alert[];
  context: string;
  questions: CriticalQuestion[];
}

// API y Tipos de Comunicaciones

export type RawStat = { date?: unknown; count?: unknown };

export type ServiceWorkerResponse = {
  status: 'success';
  data: AnalysisResult;
  source: 'cache' | 'network';
} | {
  status: 'error';
  code: string;
  error: string;
};

export interface StatData {
  date: string;
  count: number;
}

// COMPONENT PROPS
// --- Props para Componentes del Dashboard ---

export interface PaginationControlsProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DashboardPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export interface HistorialVerificacionesProps {
  page: number;
}

// --- Props para Componentes de Popup ---

export type Tab = 'analysis' | 'history';

export interface ErrorDisplayProps {
  error: { code: string; message: string };
}

export interface TarjetaFuenteProps {
  source: SourceAnalysis;
}

export interface TarjetaAlertasProps {
  alerts: Alert[];
}

export interface TarjetaContextoProps {
  context: string;
}

export interface TarjetaPreguntasProps {
  questions: CriticalQuestion[];
}