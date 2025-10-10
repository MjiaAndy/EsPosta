import type { AnalysisResult } from '../../types';

console.log("EsPosta [Service Worker]: Cargado.");

let activeTabArticle: { title: string; content: string } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; 

chrome.tabs.onActivated.addListener(() => {
  activeTabArticle = null;
});

async function fetchAnalysisFromAPI(
  payload: { url?: string; content?: string; title?: string }
): Promise<AnalysisResult> {
  console.log("EsPosta [Service Worker]: Llamando a la API de Next.js (enviando URL)...");
  let response;
  try {
    response = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("EsPosta [Service Worker]: Error de red al hacer fetch.", error);
    throw new Error('NETWORK_ERROR');
  }

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error('UI_FRAGMENT_DETECTED');
    }
    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    const errorData = await response.json();
    console.error("EsPosta [Service Worker]: Error recibido de la API:", errorData);
    throw new Error(errorData.error || 'SERVER_ERROR');
  }
  
  const data = await response.json();
  console.log("EsPosta [Service Worker]: Análisis recibido de la API.");
  return data;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.type === "CONTENT_SCRIPT_RESULT") {
    activeTabArticle = request.payload;
    if (sender.tab?.id) {
      chrome.storage.session.remove(sender.tab.id.toString());
    }
    return false;
  }

  if (request.type === "AUTH_SUCCESS") {
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id);
    }
    return false;
  }

  if (request.type === "POPUP_GET_ANALYSIS") {
    (async () => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        sendResponse({ status: 'error', code: 'NO_ACTIVE_TAB', error: 'No se pudo identificar la pestaña activa.' });
        return;
      }
      const tabId = activeTab.id;
      const cachedResult = await chrome.storage.session.get(tabId.toString());
      if (cachedResult[tabId] && (Date.now() - cachedResult[tabId].cachedAt < CACHE_TTL_MS)) {
        console.log("EsPosta [Service Worker]: Devolviendo resultado desde CACHÉ.");
        sendResponse({ status: 'success', data: cachedResult[tabId].analysis, source: 'cache' });
        return;
      }
      console.log("EsPosta [Service Worker]: Caché vacía o vencida. Buscando en la API.");
      if (activeTabArticle) {
        try {
          const payload = {
            url: activeTab.url,
            content: activeTabArticle?.content,
            title: activeTabArticle?.title
          };
          const data = await fetchAnalysisFromAPI(payload);
          const cacheEntry = { analysis: data, cachedAt: Date.now() };
          await chrome.storage.session.set({ [tabId.toString()]: cacheEntry });
          sendResponse({ status: 'success', data, source: 'network' });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Error desconocido";
          sendResponse({ status: 'error', code: errorMessage, error: errorMessage });
        }
      } else {
        sendResponse({ status: 'error', code: 'NO_CONTENT', error: 'No se ha podido extraer contenido de esta página.' });
      }
    })();
    return true; 
  }
});