import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'AxonRH - Gestão de RH',
        short_name: 'AxonRH',
        description: 'Sistema Integrado de Gestão de RH e Departamento Pessoal',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0066FF',
        icons: [
            {
                src: '/favicon.png',
                sizes: 'any',
                type: 'image/png',
            },
            {
                src: '/favicon.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/favicon.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/favicon.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    };
}
