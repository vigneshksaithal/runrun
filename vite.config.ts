import { devvit } from '@devvit/start/vite'
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        devvit()
    ],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/client/index.html'),
                preview: resolve(__dirname, 'src/client/preview.html')
            }
        }
    }
})
