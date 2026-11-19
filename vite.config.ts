import { defineConfig, type HtmlTagDescriptor } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'child_process';

const commitSha = execSync('git rev-parse --short HEAD').toString().trim();
const googleAnalyticsId = process.env.VITE_GA_MEASUREMENT_ID?.trim();
const googleTagManagerId = process.env.VITE_GTM_CONTAINER_ID?.trim();

if (googleAnalyticsId && !/^G-[A-Z0-9]+$/.test(googleAnalyticsId)) {
    throw new Error('VITE_GA_MEASUREMENT_ID must be a valid GA4 measurement ID.');
}

if (googleTagManagerId && !/^GTM-[A-Z0-9]+$/.test(googleTagManagerId)) {
    throw new Error('VITE_GTM_CONTAINER_ID must be a valid GTM container ID.');
}

// https://vite.dev/config/
export default defineConfig(() => ({
    plugins: [
        react(),
        tailwindcss(),
        {
            name: 'google-tracking',
            apply: 'build',
            transformIndexHtml: () => {
                const tags: HtmlTagDescriptor[] = [];

                if (googleAnalyticsId) {
                    tags.push(
                        {
                            tag: 'script',
                            attrs: {
                                async: true,
                                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
                            },
                            injectTo: 'head',
                        },
                        {
                            tag: 'script',
                            children: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', ${JSON.stringify(googleAnalyticsId)});`,
                            injectTo: 'head',
                        }
                    );
                }

                if (googleTagManagerId) {
                    tags.push(
                        {
                            tag: 'script',
                            children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(googleTagManagerId)});`,
                            injectTo: 'head',
                        },
                        {
                            tag: 'noscript',
                            children: [
                                {
                                    tag: 'iframe',
                                    attrs: {
                                        src: `https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`,
                                        height: '0',
                                        width: '0',
                                        style: 'display:none;visibility:hidden',
                                    },
                                },
                            ],
                            injectTo: 'body-prepend',
                        }
                    );
                }

                return tags;
            },
        },
    ],
    base: process.env.VITE_BASE_PATH ?? '/',

    // Environment-specific settings
    define: {
        // Make environment info available at build time
        __APP_VERSION__: JSON.stringify(commitSha),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    build: {
        // Enable source maps for debugging in production (optional)
        sourcemap: false,

        // Optimize chunk size warnings
        chunkSizeWarningLimit: 200, // 200KB warning threshold

        rollupOptions: {
            output: {
                // Manual chunk splitting for better caching and loading
                manualChunks: {
                    // Core React dependencies
                    'react-vendor': ['react', 'react-dom'],

                    // Map-related dependencies (large libraries)
                    maps: ['leaflet', 'react-leaflet'],

                    // Chart dependencies
                    charts: ['recharts'],

                    // GPX processing utilities
                    'gpx-utils': ['@mapbox/togeojson'],

                    // Utility libraries
                    utils: ['es-toolkit', 'file-saver'],

                    // UI components and icons
                    ui: ['lucide-react'],
                },

                // Generate consistent chunk names for better caching
                chunkFileNames: chunkInfo => {
                    // Preserve explicit manualChunks names (they have no facadeModuleId)
                    if (chunkInfo.name && !chunkInfo.facadeModuleId) {
                        return `assets/${chunkInfo.name}-[hash].js`;
                    }
                    const facadeModuleId = chunkInfo.facadeModuleId
                        ? chunkInfo.facadeModuleId
                              .split('/')
                              .pop()
                              ?.replace('.tsx', '')
                              .replace('.ts', '')
                        : 'chunk';
                    return `assets/${facadeModuleId}-[hash].js`;
                },

                // Optimize asset file names
                assetFileNames: assetInfo => {
                    const info = assetInfo.name?.split('.') ?? [];
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext ?? '')) {
                        return `assets/images/[name]-[hash][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                },
            },
        },

        // Enable esbuild minification for better compression and speed
        minify: 'esbuild',

        // Optimize CSS
        cssMinify: true,
    },

    // Optimize dependency pre-bundling
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'leaflet',
            'react-leaflet',
            'recharts',
            '@mapbox/togeojson',
            'es-toolkit',
            'file-saver',
            'lucide-react',
        ],
    },
}));
