import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: corsHeaders });
  }

  try {
    const history = await prisma.verification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc', // Las más recientes primero
      },
      take: 10, // Limitamos a las últimas 10
    });

    return new NextResponse(JSON.stringify(history), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    return new NextResponse(JSON.stringify({ error: "No se pudo obtener el historial." }), { status: 500, headers: corsHeaders });
  }
}