import notifee, { AuthorizationStatus, AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

const CHANNEL_ID = 'rate-alerts';

export const notificationService = {
  // NOTE: create Android channel before showing any notifications.
  async createAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Rate Alerts',
        importance: AndroidImportance.HIGH,
      });
    }
  },

  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      }

      await this.createAndroidChannel();
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  async showRateAlert(
    fromCurrency: string,
    toCurrency: string,
    targetRate: number,
    currentRate: number
  ): Promise<void> {
    try {
      await this.createAndroidChannel();

      await notifee.displayNotification({
        title: '🎉 Rate Alert!',
        body: `${fromCurrency} → ${toCurrency} hit ${currentRate.toFixed(4)}! (Target: ${targetRate.toFixed(4)})`,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  },

  async cancelAll(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  },
};