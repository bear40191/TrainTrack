import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.traintrack.app',
  appName: 'TrainTrack',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;

