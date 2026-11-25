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
    '/news/2026-11-24-alpha': '/news/2026-11-24/',
    // Short link for the user forum (GitHub Discussions).
    '/forum': '/docs/community/forum/',
    '/en/forum': '/en/docs/community/forum/',
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
        en: { label: 'English', lang: 'en' },
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
            { label: 'ドキュメント概要', translations: { en: 'Documentation overview' }, link: '/docs/' },
            { label: 'ZIGNOS 概要', translations: { en: 'ZIGNOS overview' }, slug: 'docs/overview' },
            { label: '哲学', translations: { en: 'Philosophy' }, slug: 'docs/philosophy' },
            { label: 'コントリビュート', translations: { en: 'Contributing' }, slug: 'docs/contributing' },
            { label: 'フォーラム', translations: { en: 'Forum' }, slug: 'docs/community/forum' },
          ],
        },
        {
          label: 'FAQ',
          items: [
            { label: 'FAQ', slug: 'docs/faq' },
            { label: 'インストール FAQ', translations: { en: 'Installation FAQ' }, slug: 'docs/faq/install' },
            { label: 'ファイルシステム', translations: { en: 'Filesystems' }, slug: 'docs/faq/filesystems' },
            { label: 'ZIGNOS の機能', translations: { en: 'ZIGNOS features' }, slug: 'docs/faq/features' },
            { label: '一般 FAQ', translations: { en: 'General FAQ' }, slug: 'docs/faq/general' },
            { label: 'コミュニティ', translations: { en: 'Community' }, slug: 'docs/faq/community' },
            { label: '制限・未実装', translations: { en: 'Limitations' }, slug: 'docs/faq/limitations' },
          ],
        },
        {
          label: '使う',
          translations: { en: 'Using' },
          items: [
            { label: 'インストール', translations: { en: 'Installation' }, slug: 'docs/install' },
            {
              label: 'システム管理',
              translations: { en: 'System administration' },
              items: [
                { label: 'システム管理', translations: { en: 'System administration' }, slug: 'docs/system' },
                { label: '設定ファイルの場所', translations: { en: 'Configuration files' }, slug: 'docs/system/config' },
                { label: 'パッケージの管理', translations: { en: 'Package management' }, slug: 'docs/system/packages' },
                { label: 'チャンネルとアップグレード', translations: { en: 'Channels and upgrades' }, slug: 'docs/system/channels' },
                { label: 'サービス (OpenRC)', translations: { en: 'Services (OpenRC)' }, slug: 'docs/system/services' },
              ],
            },
            {
              label: 'デスクトップ',
              translations: { en: 'Desktop' },
              items: [
                { label: 'デスクトップ概要', translations: { en: 'Desktop overview' }, slug: 'docs/desktops' },
                { label: 'KDE Plasma 6', slug: 'docs/system/desktop' },
                { label: 'Wayland と Xwayland', translations: { en: 'Wayland and Xwayland' }, slug: 'docs/desktops/wayland' },
                { label: '日本語入力 (fcitx5 + Mozc)', translations: { en: 'Japanese input (fcitx5 + Mozc)' }, slug: 'docs/desktops/japanese' },
                { label: 'Flatpak', slug: 'docs/desktops/flatpak' },
                { label: 'デスクトップ環境(詳細)', translations: { en: 'Desktop environment (details)' }, slug: 'docs/desktop' },
              ],
            },
          ],
        },
        {
          label: 'パッケージング',
          translations: { en: 'Packaging' },
          items: [
            { label: 'パッケージング概要', translations: { en: 'Packaging overview' }, slug: 'docs/packaging' },
            { label: 'ワークフロー', translations: { en: 'Workflow' }, slug: 'docs/packaging/workflow' },
            { label: 'レシピ', translations: { en: 'Recipes' }, slug: 'docs/packaging/recipes' },
            { label: 'ビルドパターン', translations: { en: 'Build patterns' }, slug: 'docs/packaging/patterns' },
            { label: 'システムアカウント', translations: { en: 'System accounts' }, slug: 'docs/packaging/accounts' },
          ],
        },
        {
          label: '開発',
          translations: { en: 'Development' },
          items: [
            { label: '開発者向け概要', translations: { en: 'Developer overview' }, slug: 'docs/developers' },
            { label: 'zpkg 設計', translations: { en: 'zpkg design' }, slug: 'docs/design-pkg' },
            { label: 'zpkg 設定', translations: { en: 'zpkg configuration' }, slug: 'docs/zpkg-config' },
            { label: '署名と検証', translations: { en: 'Signing and verification' }, slug: 'docs/signing' },
            { label: 'ビルド隔離', translations: { en: 'Build sandbox' }, slug: 'docs/build-sandbox' },
            { label: '再現可能ビルド', translations: { en: 'Reproducible builds' }, slug: 'docs/reproducibility' },
            { label: 'リリースマニフェスト', translations: { en: 'Release manifest' }, slug: 'docs/release-manifest' },
            { label: 'ロードマップ', translations: { en: 'Roadmap' }, slug: 'docs/roadmap' },
          ],
        },
        {
          label: 'リファレンス',
          translations: { en: 'Reference' },
          items: [
            { label: 'stage3 リファレンス', translations: { en: 'stage3 reference' }, slug: 'docs/stage3' },
            { label: 'リリースチャンネル', translations: { en: 'Release channels' }, slug: 'docs/channels' },
            { label: 'システム設計', translations: { en: 'System design' }, slug: 'docs/design-system' },
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
