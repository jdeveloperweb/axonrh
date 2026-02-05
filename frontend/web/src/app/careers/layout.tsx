import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trabalhe Conosco | Carreiras',
    description: 'Confira nossas vagas abertas e faça parte do nosso time.',
};

export default function CareersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
