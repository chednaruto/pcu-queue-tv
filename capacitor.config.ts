import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'th.go.xhealth.pcuqueuedisplay',
  appName: 'PCU Queue Display',
  webDir: 'www/browser',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#071225'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
