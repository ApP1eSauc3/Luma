import BackgroundFetch from 'react-native-background-fetch';
import { rateService } from './rateService';
import { storageService } from './storageService';
import { notificationService } from './notificationService';

export const backgroundRateChecker = {
  async configure() {
    try {
      await BackgroundFetch.configure(
        {
          minimumFetchInterval: 60,
          stopOnTerminate: false,
          enableHeadless: true,
          startOnBoot: true,
        },
        async (taskId) => {
          console.log('[BackgroundFetch] Checking rates...');
          await this.checkAllAlerts();
          BackgroundFetch.finish(taskId);
        },
        (taskId) => {
          console.log('[BackgroundFetch] TIMEOUT:', taskId);
          BackgroundFetch.finish(taskId);
        }
      );

      await BackgroundFetch.start();
    } catch (error) {
      console.error('[BackgroundFetch] Configure error:', error);
    }
  },

  async checkAllAlerts() {
    try {
      const alerts = await storageService.getAlerts();
      
      for (const alert of alerts) {
        if (!alert.isActive) continue;

        const rate = await rateService.getExchangeRate(
          alert.fromCurrency,
          alert.toCurrency
        );

        const updatedAlert = { ...alert, currentRate: rate};
        await storageService.saveAlert(updatedAlert);

        if (rate >= alert.targetRate) {
          await notificationService.showRateAlert(
            alert.fromCurrency,
            alert.toCurrency,
            alert.targetRate,
            rate
          );

          const deactivated = { ...updatedAlert, isActive: false };
          await storageService.saveAlert(deactivated);
        }
      }
    } catch (error) {
      console.error('[Background Check] Error:', error);
    }
  },

  async stop() {
    try {
      await BackgroundFetch.stop();
    } catch (error) {
      console.error('[BackgroundFetch] Stop error:', error);
    }
  },
};