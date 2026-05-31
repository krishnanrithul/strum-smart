import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.rithul.fretgym',
  appName: 'FretGym',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      autoHide: true,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
    },
  },
};

export default config;
