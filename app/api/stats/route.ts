// app/api/stats/route.ts
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const verificationsByDay = (await prisma.$queryRaw`
      SELECT DATE("createdAt") AS verification_date, COUNT(id) AS count
      FROM verifications
      WHERE "userId" = ${session.user.id}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
      LIMIT 15;
    `) as Array<Record<string, unknown>>;

    const formattedData = verificationsByDay.map((day) => {
      const dateRaw = day['verification_date'];
      const countRaw = day['count'];

      const date = dateRaw ? new Date(String(dateRaw)).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : '';
      let countNum = 0;
      if (typeof countRaw === 'bigint') countNum = Number(countRaw);
      else if (typeof countRaw === 'number') countNum = countRaw;
      else if (typeof countRaw === 'string') {
        const n = Number(countRaw);
        countNum = Number.isFinite(n) ? n : 0;
      }
      return { date, count: Number.isFinite(countNum) ? countNum : 0 };
    });

    return NextResponse.json(formattedData ?? [], { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[/api/stats] Error al obtener estadísticas:', error);
    return NextResponse.json({ error: "No se pudieron obtener las estadísticas." }, { status: 500 });
  }
}
