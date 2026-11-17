import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// Official ZIGNOS Project site. GitHub Pages serves this from the org root:
//   https://studio-nosa-tech.github.io/
// Public docs live under /docs (they are the canonical copies).
export default defineConfig({
  site: 'https://studio-nosa-tech.github.io',
  integrations: [
    starlight({
      title: 'ZIGNOS',
      description:
        'ゼロからビルドする、ソースベースの Linux ディストリビューション。zpkg・OpenRC・ローリングリリース。',
      logo: {
        src: './src/assets/logo.png',
        alt: 'ZIGNOS',
      },
      favicon: '/favicon.png',
      defaultLocale: 'root',
      locales: {
        root: { label: '日本語', lang: 'ja' },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/studio-nosa-tech',
        },
      ],
      sidebar: [
        {
          label: 'ZIGNOS',
          items: [{ label: 'ドキュメント概要', link: '/docs/' }],
        },
        {
          label: 'インストール',
          items: [
            { label: '実機インストール', slug: 'docs/install' },
            { label: 'stage3', slug: 'docs/stage3' },
          ],
        },
        {
          label: '設計',
          items: [
            { label: 'zpkg', slug: 'docs/design-pkg' },
            { label: 'システム', slug: 'docs/design-system' },
          ],
        },
        {
          label: 'プロジェクト',
          items: [{ label: 'ロードマップ', slug: 'docs/roadmap' }],
        },
      ],
      customCss: ['/src/styles/starlight.css'],
      lastUpdated: false,
      credits: false,
      // We ship a branded 404 at src/pages/404.astro instead.
      disable404Route: true,
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0b0b10' } },
      ],
    }),
    sitemap(),
  ],
});
