import type { Config } from 'tailwindcss';
const config: Config = { darkMode: 'class', content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { pine: '#065f46', forest: '#047857', moss: '#059669', cream: '#f4f8f4', clay: '#b66b45', ink: '#23332e' }, fontFamily: { sans: ['var(--font-geist)'] } } }, plugins: [] };
export default config;
