import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'node:path'

// `vite`        → dev server (src/main.tsx)
// `vite build`  → library build (src/lib.tsx → dist/anubis-cabinet.js)
//                  CSS inlined via ?inline import — consumers ship a
//                  single <script type="module"> tag.
export default defineConfig(({ command }) => ({
    plugins: [preact()],
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat',
            'react/jsx-runtime': 'preact/jsx-runtime',
        },
        dedupe: ['preact'],
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development'),
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/lib.tsx'),
            formats: ['es'],
            fileName: () => 'anubis-cabinet.js',
        },
        cssCodeSplit: false,
        rollupOptions: {
            output: { inlineDynamicImports: true },
        },
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2022',
    },
}))
