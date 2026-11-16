import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antigravity.mobile',
  appName: 'Antigravity',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'ionic',
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile'
  }
};

export default config;
