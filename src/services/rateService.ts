import axios from 'axios';
import { TransferOption } from '../types';
import { calculateFee } from '../utils/currency';

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';

// Fixed: in-memory cache to prevent multiple simultaneous API calls
// for the same currency pair (e.g. when loading multiple accounts)
const rateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const rateService = {
  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}_${to}`;
    const cached = rateCache[cacheKey];

    // Return cached rate if it's still fresh
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.rate;
    }

    try {
      const response = await axios.get(`${EXCHANGE_RATE_API}/${from}`);
      const rate = response.data.rates[to];

      // Store in cache with current timestamp
      rateCache[cacheKey] = { rate, timestamp: Date.now() };

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  },

  // Clear cache manually if needed (e.g. user pulls to refresh)
  clearCache() {
    Object.keys(rateCache).forEach(key => delete rateCache[key]);
  },

  async compareTransfers(
    from: string,
    to: string,
    amount: number
  ): Promise<TransferOption[]> {
    try {
      const baseRate = await this.getExchangeRate(from, to);
      const options: TransferOption[] = [];

      // Note: rate multipliers below are estimates, not live provider data.

      const wiseFee = calculateFee(amount, 'wise');
      options.push({
        provider: 'wise',
        providerName: 'Wise',
        rate: baseRate * 0.998,
        fee: wiseFee,
        youReceive: (amount - wiseFee) * (baseRate * 0.998),
        transferTime: '1-2 business days',
      });

      options.push({
        provider: 'revolut',
        providerName: 'Revolut',
        rate: baseRate * 0.996,
        fee: 0,
        youReceive: amount * (baseRate * 0.996),
        transferTime: '1 business day',
      });

      const ofxFee = calculateFee(amount, 'ofx');
      options.push({
        provider: 'ofx',
        providerName: 'OFX',
        rate: baseRate * 0.995,
        fee: ofxFee,
        youReceive: (amount - ofxFee) * (baseRate * 0.995),
        transferTime: '1-2 business days',
      });

      const bankFee = calculateFee(amount, 'bank');
      options.push({
        provider: 'bank',
        providerName: 'Bank Wire',
        rate: baseRate * 0.97,
        fee: bankFee,
        youReceive: (amount - bankFee) * (baseRate * 0.97),
        transferTime: '3-5 business days',
      });

      return options.sort((a, b) => b.youReceive - a.youReceive);
    } catch (error) {
      console.error('Error comparing transfers:', error);
      throw error;
    }
  },
};