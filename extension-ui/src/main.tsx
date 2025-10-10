import React from 'react';
import ReactDOM from 'react-dom/client';
import { PanelAnalisis } from '@/components/PanelAnalisis';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="w-[450px] rounded-lg overflow-hidden">
      <PanelAnalisis />
    </div>
  </React.StrictMode>,
);