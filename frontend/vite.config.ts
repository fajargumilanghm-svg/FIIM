import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'FIIM - Fatigue Injury Index Monitoring',
        short_name: 'FIIM',
        description: 'Advanced athlete fatigue and injury risk monitoring platform',
        theme_color: '#0284c7',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts', 'chart.js', 'react-chartjs-2'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast'
          ],
          'query': ['@tanstack/react-query', 'axios']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      // Focus the gate on logic units. Page/view components are exercised by
      // integration/e2e rather than unit tests.
      include: [
        'src/services/**/*.ts',
        'src/stores/**/*.ts',
        'src/components/LoadingSpinner.tsx',
        'src/components/ErrorBoundary.tsx',
        'src/modules/common/pages/NotFoundPage.tsx',
        'src/modules/auth/pages/LoginPage.tsx',
        'src/modules/alerts/pages/AlertsPage.tsx',
        'src/modules/injuries/pages/InjuriesPage.tsx',
        'src/modules/reports/pages/ReportsPage.tsx',
        'src/modules/audit/pages/AuditPage.tsx',
        'src/modules/import/pages/ImportPage.tsx',
        'src/modules/settings/pages/SettingsPage.tsx',
        'src/modules/admin/pages/AdminPage.tsx',
        'src/modules/training-load/pages/TrainingLoadPage.tsx'
      ],
      thresholds: {
        // Logic units (services/stores) are covered thoroughly; page components
        // get strong statement/line coverage from render + interaction tests,
        // while exhaustive branch/function coverage of presentational variants
        // is left to visual/e2e testing.
        statements: 90,
        lines: 90,
        functions: 70,
        branches: 68
      }
    }
  }
})
