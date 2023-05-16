import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'esp32-ble',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
