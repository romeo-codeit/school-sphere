import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.romeocodeit.ohmanfoundations',
  appName: 'OhmanFoundations',
  webDir: 'dist/public',
  server: {
    // Allow secure contexts for getUserMedia in Capacitor
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    // Enable media permissions prompts
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
