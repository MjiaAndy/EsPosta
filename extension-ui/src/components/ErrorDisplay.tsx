import { AlertCircle, WifiOff, LogIn, FileWarning } from 'lucide-react';
import {ErrorDisplayProps} from '../../../types'

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  let icon = <AlertCircle className="h-8 w-8 text-danger" />;
  let title = "Ocurrió un Error";
  let message = error.message;

  switch (error.code) {
    case 'UI_FRAGMENT_DETECTED':
      icon = <FileWarning className="h-8 w-8 text-accent" />;
      title = "Contenido no Analizable";
      message = "El texto detectado no parece ser un artículo. Por favor, navega a la noticia completa y vuelve a intentarlo.";
      break;
    case 'NETWORK_ERROR':
      icon = <WifiOff className="h-8 w-8 text-accent" />;
      title = "Error de Red";
      message = "No se pudo conectar. Por favor, revisa tu conexión a internet.";
      break;
    case 'SESSION_EXPIRED':
      icon = <LogIn className="h-8 w-8 text-accent" />;
      title = "Sesión Expirada";
      message = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.";
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center min-h-[250px]">
      {icon}
      <p className="font-semibold text-foreground-strong">{title}</p>
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
}