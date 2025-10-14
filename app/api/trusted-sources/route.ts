import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const sources = await prisma.trustedSource.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(sources);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { domain } = await request.json();
  if (!domain) return NextResponse.json({ error: "El dominio es requerido" }, { status: 400 });

  try {
    const newSource = await prisma.trustedSource.create({
      data: {
        userId: session.user.id,
        domain: new URL(domain).hostname.replace(/^www\./, ''), 
      },
    });
    return NextResponse.json(newSource, { status: 201 });
  } catch  {
    return NextResponse.json({ error: "El dominio ya existe o es inválido" }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "El ID de la fuente es requerido" }, { status: 400 });
  
    await prisma.trustedSource.delete({
      where: {
        id: id,
        userId: session.user.id, 
      },
    });
    return new NextResponse(null, { status: 204 });
  }