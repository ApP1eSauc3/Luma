import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { Platform } from 'react-native';

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }
    return true;
  },

  async createChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'rate-alerts',
        name: 'Rate Alerts',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    }
  },

  
  async showRateAlert(
    fromCurrency: string,
    toCurrency: string,
    targetRate: number,
    currentRate: number
  ): Promise<void> {
    await this.createChannel();

    await notifee.displayNotification({
      title: '🎉 Rate Alert Triggered!',
      body: `${fromCurrency} → ${toCurrency} hit ${currentRate.toFixed(4)}! (Target: ${targetRate.toFixed(4)})`,
      ios: {
        sound: 'default',
        criticalVolume: 1.0,
      },
      android: {
        channelId: 'rate-alerts',
        sound: 'default',
        pressAction: {
          id: 'default',
        },
      },
    });
  },

  // Cancel all notifications
  async cancelAll(): Promise<void> {
    await notifee.cancelAllNotifications();
  },
};