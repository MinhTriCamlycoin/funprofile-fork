import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    splitVendorChunkPlugin(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Web3 libraries - completely deferred, only on Wallet page
          if (id.includes('wagmi') || id.includes('viem') || id.includes('rainbowkit')) {
            return 'vendor-web3';
          }
          // Charts - only on pages with charts
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          // Core React - smallest critical chunk
          if (id.includes('react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          // Data layer
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          // UI components - split smaller
          if (id.includes('@radix-ui')) {
            return 'vendor-ui';
          }
          // Utils
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'vendor-utils';
          }
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 150,
    // Aggressive tree shaking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
    // Smaller output
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: [
      // Exclude heavy libs from pre-bundling - load on demand
      'wagmi',
      'viem', 
      '@rainbow-me/rainbowkit',
      'recharts',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Performance hints
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
}));
