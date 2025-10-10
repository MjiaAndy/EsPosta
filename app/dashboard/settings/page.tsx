import { PanelAjustes } from "./components/PanelAjustes";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground-strong">Ajustes</h1>
      <p className="mt-2 text-foreground">
        Gestiona tus preferencias y fuentes confiables.
      </p>
      <PanelAjustes />
    </div>
  );
}