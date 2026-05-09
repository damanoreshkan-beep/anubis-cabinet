/** @type {import('tailwindcss').Config} */
// Mirrors the AnubisWorld palette used by the website + auth widget.
// `important: '.aw-cabinet-scope'` scopes every utility selector to the
// `.aw-cabinet-scope` ancestor — same pattern the auth widget uses, keeps
// utility CSS from leaking into the embedding host (launcher / partner site).
export default {
    content: ['./src/**/*.{ts,tsx,html}', './index.html'],
    important: '.aw-cabinet-scope',
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            colors: {
                brand: {
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                },
                violet: {
                    400: '#c084fc',
                    500: '#a855f7',
                },
                egypt: {
                    400: '#22d3ee',
                },
                amber: {
                    400: '#fbbf24',
                },
                surface: {
                    900: '#070612',
                    950: '#040309',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
