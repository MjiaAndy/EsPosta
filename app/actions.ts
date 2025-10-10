'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ITEMS_PER_PAGE = 10;

export async function getVerifications(page: number = 1) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'No autenticado', verifications: [], total: 0 };
  }

  try {
    const skip = (page - 1) * ITEMS_PER_PAGE;
    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: ITEMS_PER_PAGE,
        skip: skip,
      }),
      prisma.verification.count({
        where: { userId: session.user.id },
      }),
    ]);
    
    return { verifications, total };
  } catch (error) {
    console.error("Error al obtener verificaciones:", error);
    return { error: 'Error de base de datos', verifications: [], total: 0 };
  }
}