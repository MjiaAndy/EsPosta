'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {PaginationControlsProps} from '@/types'

export function PaginationControls({ hasNextPage, hasPrevPage }: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get('page') ?? '1';

  return (
    <div className="flex gap-2 justify-center mt-4">
      <button
        className="bg-background-alt p-2 rounded-md disabled:opacity-50"
        disabled={!hasPrevPage}
        onClick={() => router.push(`/dashboard?page=${Number(page) - 1}`)}
      >
        <ChevronLeft size={16} />
      </button>
      <div className="p-2 text-sm">
        Página {page}
      </div>
      <button
        className="bg-background-alt p-2 rounded-md disabled:opacity-50"
        disabled={!hasNextPage}
        onClick={() => router.push(`/dashboard?page=${Number(page) + 1}`)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}