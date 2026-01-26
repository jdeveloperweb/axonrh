import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">404</p>
      <h1 className="mt-4 text-3xl font-semibold text-white">Página não encontrada</h1>
      <p className="mt-3 max-w-lg text-base text-slate-300">
        Não conseguimos encontrar o conteúdo solicitado. Verifique o endereço ou volte para a página inicial.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
      >
        Ir para o início
      </Link>
    </div>
  );
}
