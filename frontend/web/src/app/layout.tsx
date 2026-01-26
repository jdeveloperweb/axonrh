import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AxonRH - Gestão de RH e DP',
  description: 'Sistema Integrado de Gestão de RH e Departamento Pessoal com IA Conversacional',
  keywords: ['RH', 'Departamento Pessoal', 'Gestão de Pessoas', 'IA', 'HRIS'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
