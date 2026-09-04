import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'th.go.xhealth.pcuqueuedisplay',
  appName: 'PCU Queue Display',
  // Angular 20 application builder writes browser assets under www/browser.
  // Capacitor must point to the directory that directly contains index.html.
  webDir: 'www/browser',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f172a'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
