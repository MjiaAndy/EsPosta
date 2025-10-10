// app/api/stats/route.ts
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const verificationsByDay: Array<{ verification_date: Date; count: bigint | number | string }> =
      await prisma.$queryRaw`
        SELECT DATE("createdAt") AS verification_date, COUNT(id) AS count
        FROM verifications
        WHERE "userId" = ${session.user.id}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
        LIMIT 15;
      `;

    const formattedData = verificationsByDay.map((day) => {
      const rawCount = (day as any).count ?? 0;
      const countNum = typeof rawCount === 'bigint'
        ? Number(rawCount)
        : Number(rawCount);

      return {
        date: new Date((day as any).verification_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        count: Number.isFinite(countNum) ? countNum : 0,
      };
    });

    return NextResponse.json(formattedData ?? [], { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[/api/stats] Error al obtener estadísticas:', error);
    return NextResponse.json({ error: "No se pudieron obtener las estadísticas." }, { status: 500 });
  }
}
