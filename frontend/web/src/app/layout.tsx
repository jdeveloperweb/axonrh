import type { Metadata } from 'next';
import {
  Outfit,
  Plus_Jakarta_Sans,
  Inter,
  Roboto,
  Open_Sans,
  Montserrat,
  Ubuntu,
  Lato,
  Poppins,
  Raleway,
  Playfair_Display,
  Nunito,
  Merriweather,
  PT_Sans,
  Lora,
  Oxygen,
  Source_Sans_3
} from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';


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
const ubuntu = Ubuntu({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
  display: 'swap',
});
const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
});
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});
const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});
const merriweather = Merriweather({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-merriweather',
  display: 'swap',
});
const ptSans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-ptsans',
  display: 'swap',
});
const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});
const oxygen = Oxygen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-oxygen',
  display: 'swap',
});
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sourcesans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AxonRH - Gestão de RH e DP',
  description: 'Sistema Integrado de Gestão de RH e Departamento Pessoal com IA Conversacional',
  keywords: ['RH', 'Departamento Pessoal', 'Gestão de Pessoas', 'IA', 'HRIS'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakarta.variable} ${outfit.variable} ${inter.variable} ${roboto.variable} ${openSans.variable} ${montserrat.variable} ${ubuntu.variable} ${lato.variable} ${poppins.variable} ${raleway.variable} ${playfair.variable} ${nunito.variable} ${merriweather.variable} ${ptSans.variable} ${lora.variable} ${oxygen.variable} ${sourceSans.variable} font-sans`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
