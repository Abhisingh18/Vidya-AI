import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VidyaAI — Animated lessons in every Indian language',
    short_name: 'VidyaAI',
    description:
      'AI-powered animated educational videos for Indian students. Any topic, 22 languages, on demand.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF7',
    theme_color: '#FF6B2C',
    orientation: 'portrait',
    categories: ['education'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
