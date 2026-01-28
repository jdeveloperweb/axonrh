import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, Inter, Roboto, Open_Sans, Montserrat } from 'next/font/google';
import './globals.css';


const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-primary',
  display: 'swap',
});
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-secondary',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});
const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-opensans',
  display: 'swap',
});
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AxonRH - Gestão de RH e DP',
  description: 'Sistema Integrado de Gestão de RH e Departamento Pessoal com IA Conversacional',
  keywords: ['RH', 'Departamento Pessoal', 'Gestão de Pessoas', 'IA', 'HRIS'],
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakarta.variable} ${outfit.variable} ${inter.variable} ${roboto.variable} ${openSans.variable} ${montserrat.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
