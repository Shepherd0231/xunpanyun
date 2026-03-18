// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  trailingSlash: 'never',
  site: 'https://yourbrand.com',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'de'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          zh: 'zh-CN',
          de: 'de-DE',
        },
      },
    }),
    sanity({
      projectId: '39od49xj',
      dataset: 'production',
      studioBasePath: '/admin',
      useCdn: false,
      apiVersion: '2024-01-01',
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
