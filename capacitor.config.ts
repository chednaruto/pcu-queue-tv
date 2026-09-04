import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'th.go.xhealth.pcuqueuedisplay',
  appName: 'PCU Queue Display',
  webDir: 'www',
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
