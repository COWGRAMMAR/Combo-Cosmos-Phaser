import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('../src', import.meta.url));

export default defineConfig({
    base: './',
    resolve: {
        alias: {
            '@': srcDir
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 8080
    }
});
