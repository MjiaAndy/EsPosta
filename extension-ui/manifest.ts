import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'EsPosta Verificador',
  description: 'Asistente de IA para analizar la credibilidad de contenido digital y fomentar el pensamiento crítico.',
  version: pkg.version,
  action: {
    default_popup: 'index.html',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content.ts'],
      
    },
    {
      matches: ['http://localhost:3000/auth/success'],
      js: ['src/auth-bridge.ts'],
    }
  ],
  permissions: [
    "activeTab", 
    "storage"   
  ],
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
});