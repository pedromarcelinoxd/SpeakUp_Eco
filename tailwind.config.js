import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.js',
    ],

    theme: {
        extend: {
            // Mesmos tokens do app mobile (mobile/src/design/tokens.ts)
            fontFamily: {
                sans: ['"Archivo Variable"', 'Archivo', ...defaultTheme.fontFamily.sans],
                display: ['"Archivo Variable"', 'Archivo', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Verde-petróleo: marca, navegação ativa e botões principais (áreas pequenas)
                eco: {
                    DEFAULT: '#176B56',
                    50: '#EEF5F1',
                    100: '#DDEBE2', // realce suave
                    200: '#BFD9CA',
                    300: '#9CCBB3',
                    500: '#3E8C74',
                    600: '#176B56',
                    700: '#125847',
                    800: '#0F4A3B',
                    900: '#0B3A2E',
                },
                // Coral queimado: só a ação de denunciar e os marcadores de ocorrência
                coral: { DEFAULT: '#E77A5B', pressed: '#D9694A', tint: '#FBE9E3', ink: '#A9472B', on: '#202A27' },
                stone: { DEFAULT: '#ECEEE8', dark: '#DCE2DC' }, // preenchimento neutro · bordas e divisórias
                line: '#DCE2DC',
                canvas: '#F7F6F0', // marfim suave
                ink: {
                    DEFAULT: '#202A27', // carvão
                    muted: '#65726C', // cinza-sálvia (#68756F) levemente escurecido: >= 4,5:1 no marfim
                },
                // Estados semânticos (separados da marca)
                alert: '#DC2626', // urgente / erro
                pending: '#B45309', // âmbar legível para textos de aviso
                info: '#2563EB',
            },
            boxShadow: {
                card: '0 1px 2px rgba(32, 42, 39, 0.04), 0 1px 3px rgba(32, 42, 39, 0.04)',
                lift: '0 4px 12px -2px rgba(32, 42, 39, 0.08), 0 2px 4px -2px rgba(32, 42, 39, 0.04)',
                float: '0 12px 32px -8px rgba(32, 42, 39, 0.16), 0 4px 8px -4px rgba(32, 42, 39, 0.08)',
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1.125rem',
            },
            keyframes: {
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(6px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
                'radar-sweep': {
                    '0%': { transform: 'scale(0.6)', opacity: '0.7' },
                    '100%': { transform: 'scale(2.2)', opacity: '0' },
                },
            },
            animation: {
                'fade-up': 'fade-up .35s cubic-bezier(.2,.7,.3,1) both',
                shimmer: 'shimmer 1.4s infinite',
                radar: 'radar-sweep 2.4s cubic-bezier(.2,.6,.3,1) infinite',
            },
        },
    },

    plugins: [forms],
};
