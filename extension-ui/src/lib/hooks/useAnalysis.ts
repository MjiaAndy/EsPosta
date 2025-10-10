import { useState, useEffect } from 'react';
import type { ServiceWorkerResponse, AnalysisResult  } from '../../../../types';

export function useAnalysis() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [source, setSource] = useState<'cache' | 'network' | null>(null);

  useEffect(() => {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: "POPUP_GET_ANALYSIS" }, (response: ServiceWorkerResponse) => {
        if (chrome.runtime.lastError) {
          console.error("Error de comunicación:", chrome.runtime.lastError.message);
          setError({ code: 'COMMUNICATION_ERROR', message: 'No se pudo comunicar con el proceso de fondo.' });
        } else if (response) {
          if (response.status === 'success') {
            setAnalysisResult(response.data);
            setSource(response.source);
          } else {
            setError({ code: response.code, message: response.error });
          }
        } else {
          setError({ code: 'NO_RESPONSE', message: 'No se recibió respuesta del Service Worker.' });
        }
        setIsLoading(false);
      });
    } else {
      setError({ code: 'NOT_IN_EXTENSION', message: 'Esta función solo está disponible en la extensión.' });
      setIsLoading(false);
    }
  }, []);
  return { analysisResult, isLoading, error, source };
}