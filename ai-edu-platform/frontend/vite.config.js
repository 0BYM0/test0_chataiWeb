import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 node_modules 中的模块单独打包
          if (id.includes('node_modules')) {
            // tdesign-vue-next 单独打包
            if (id.includes('tdesign-vue-next')) {
              return 'tdesign-vue-next';
            }
            // vue 相关库打包成一个
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-family';
            }
            // supabase 单独打包
            if (id.includes('@supabase')) {
                return 'supabase';
            }
            // 其他 node_modules 库打包成 vendor
            return 'vendor';
          }
        },
      },
    },
  },
});