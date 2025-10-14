import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GraficosEstadisticas } from "./components/GraficosEstadisticas";
import { HistorialVerificaciones } from "./components/HistorialVerificaciones";
import type { DashboardPageProps } from "@/types";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [params, session] = await Promise.all([
    Promise.resolve(searchParams) as Promise<Record<string, string | string[] | undefined> | undefined>,
    getServerSession(authOptions),
  ]);

  const rawPage = Array.isArray(params?.page) ? params.page[0] : params?.page;
  const parsed = Number.parseInt(rawPage ?? '1', 10);
  const page = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;

  return (
    <div>
      <h1 className="text-3xl font-bold">Hola {session?.user?.name ?? 'Usuario'}</h1>
      <p className="mt-2">Esta es tu actividad reciente.</p>
      <GraficosEstadisticas />
      <HistorialVerificaciones page={page} />
    </div>
  );
}
