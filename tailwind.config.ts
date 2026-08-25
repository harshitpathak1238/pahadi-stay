import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { pine: '#173f35', forest: '#24584a', moss: '#6d8b62', cream: '#f7f4ec', clay: '#b66b45', ink: '#23332e' }, fontFamily: { sans: ['var(--font-geist)'] } } }, plugins: [] };
export default config;
