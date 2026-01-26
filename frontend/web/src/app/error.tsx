'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Ops</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Algo saiu do esperado</h1>
          <p className="mt-3 text-base text-slate-300">
            Encontramos um erro ao carregar esta página. Tente recarregar ou volte para a página inicial.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              className="rounded-md border border-slate-700 px-5 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
            >
              Voltar ao início
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
