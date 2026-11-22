import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkRelease from './src/plugins/remark-release.mjs';

// Official ZIGNOS Project site. GitHub Pages serves this from the org root:
//   https://studio-nosa-tech.github.io/
// Public docs live under /docs (they are the canonical copies).
export default defineConfig({
  site: 'https://studio-nosa-tech.github.io',
  // The old multi-page installer was merged into /docs/install/.
  redirects: {
    '/docs/getting-started': '/docs/install/',
    '/docs/getting-started/requirements': '/docs/install/',
    '/docs/getting-started/download': '/docs/install/',
    '/docs/getting-started/media': '/docs/install/',
    '/docs/getting-started/boot': '/docs/install/',
    '/docs/getting-started/install': '/docs/install/',
    '/docs/getting-started/first-boot': '/docs/install/',
  },
  markdown: {
    processor: unified({ remarkPlugins: [remarkRelease] }),
  },
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
          items: [
            { label: 'ドキュメント概要', link: '/docs/' },
            { label: 'ZIGNOS 概要', slug: 'docs/overview' },
            { label: '哲学', slug: 'docs/philosophy' },
            { label: 'コントリビュート', slug: 'docs/contributing' },
          ],
        },
        {
          label: 'FAQ',
          items: [
            { label: 'FAQ', slug: 'docs/faq' },
            { label: 'インストール FAQ', slug: 'docs/faq/install' },
            { label: 'ファイルシステム', slug: 'docs/faq/filesystems' },
            { label: 'ZIGNOS の機能', slug: 'docs/faq/features' },
            { label: '一般 FAQ', slug: 'docs/faq/general' },
            { label: 'コミュニティ', slug: 'docs/faq/community' },
            { label: '制限・未実装', slug: 'docs/faq/limitations' },
          ],
        },
        {
          label: '使う',
          items: [
            { label: 'インストール', slug: 'docs/install' },
            {
              label: 'システム管理',
              items: [
                { label: 'システム管理', slug: 'docs/system' },
                { label: '設定ファイルの場所', slug: 'docs/system/config' },
                { label: 'パッケージの管理', slug: 'docs/system/packages' },
                { label: 'チャンネルとアップグレード', slug: 'docs/system/channels' },
                { label: 'サービス (OpenRC)', slug: 'docs/system/services' },
              ],
            },
            {
              label: 'デスクトップ',
              items: [
                { label: 'デスクトップ概要', slug: 'docs/desktops' },
                { label: 'KDE Plasma 6', slug: 'docs/system/desktop' },
                { label: 'Wayland と Xwayland', slug: 'docs/desktops/wayland' },
                { label: 'デスクトップ環境(詳細)', slug: 'docs/desktop' },
              ],
            },
          ],
        },
        {
          label: 'パッケージング',
          items: [
            { label: 'パッケージング概要', slug: 'docs/packaging' },
            { label: 'ワークフロー', slug: 'docs/packaging/workflow' },
            { label: 'レシピ', slug: 'docs/packaging/recipes' },
            { label: 'ビルドパターン', slug: 'docs/packaging/patterns' },
            { label: 'システムアカウント', slug: 'docs/packaging/accounts' },
          ],
        },
        {
          label: '開発',
          items: [
            { label: '開発者向け概要', slug: 'docs/developers' },
            { label: 'zpkg 設計', slug: 'docs/design-pkg' },
            { label: 'zpkg 設定', slug: 'docs/zpkg-config' },
            { label: '署名と検証', slug: 'docs/signing' },
            { label: 'ビルド隔離', slug: 'docs/build-sandbox' },
            { label: '再現可能ビルド', slug: 'docs/reproducibility' },
            { label: 'リリースマニフェスト', slug: 'docs/release-manifest' },
            { label: 'ロードマップ', slug: 'docs/roadmap' },
          ],
        },
        {
          label: 'リファレンス',
          items: [
            { label: 'stage3 リファレンス', slug: 'docs/stage3' },
            { label: 'リリースチャンネル', slug: 'docs/channels' },
            { label: 'システム設計', slug: 'docs/design-system' },
          ],
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
