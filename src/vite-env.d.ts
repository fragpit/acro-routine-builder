/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare const __APP_VERSION__: string;
declare const __CF_ANALYTICS_TOKEN__: string | null;
