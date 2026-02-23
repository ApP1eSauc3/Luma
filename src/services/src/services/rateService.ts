import axios from 'axios';
import { TransferOption } from '../types';
import { calculateFee } from '../utils/currency';

const WISE_API = 'https://api.transferwise.com';
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';

export const rateService = {
  // Get real-time exchange rate
  async getExchangeRate(from: string, to: string): Promise<number> {
    try {
      const response = await axios.get(`${EXCHANGE_RATE_API}/${from}`);
      return response.data.rates[to];
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      throw new Error('Failed to fetch exchange rate');
    }
  },

  // Get Wise rate (public API - no auth needed!)
  async getWiseRate(from: string, to: string): Promise<number> {
    try {
      const response = await axios.get(`${WISE_API}/v1/rates`, {
        params: { source: from, target: to }
      });
      return response.data[0].rate;
    } catch (error) {
      console.error('Error fetching Wise rate:', error);
      // Fallback to general rate
      return this.getExchangeRate(from, to);
    }
  },

  // Compare all transfer options
  async compareTransfers(
    from: string,
    to: string,
    amount: number
  ): Promise<TransferOption[]> {
    try {
      // Get base rate
      const baseRate = await this.getExchangeRate(from, to);
      const wiseRate = await this.getWiseRate(from, to);

      const options: TransferOption[] = [];

      // Wise
      const wiseFee = calculateFee(amount, 'wise');
      options.push({
        provider: 'wise',
        providerName: 'Wise',
        rate: wiseRate,
        fee: wiseFee,
        youReceive: (amount - wiseFee) * wiseRate,
        transferTime: '1-2 business days',
      });

      // Revolut (use slightly worse rate, no fee up to limit)
      const revolutRate = baseRate * 0.998; // 0.2% worse than market
      options.push({
        provider: 'revolut',
        providerName: 'Revolut',
        rate: revolutRate,
        fee: 0, // Free up to monthly limit
        youReceive: amount * revolutRate,
        transferTime: '1 business day',
      });

      // OFX (better rate for large amounts)
      const ofxRate = baseRate * 0.995; // 0.5% worse than market
      const ofxFee = calculateFee(amount, 'ofx');
      options.push({
        provider: 'ofx',
        providerName: 'OFX',
        rate: ofxRate,
        fee: ofxFee,
        youReceive: (amount - ofxFee) * ofxRate,
        transferTime: '1-2 business days',
      });

      // Bank wire (worst option)
      const bankRate = baseRate * 0.97; // 3% worse than market
      const bankFee = calculateFee(amount, 'bank');
      options.push({
        provider: 'bank',
        providerName: 'Bank Wire',
        rate: bankRate,
        fee: bankFee,
        youReceive: (amount - bankFee) * bankRate,
        transferTime: '3-5 business days',
      });

      // Sort by amount received (best first)
      return options.sort((a, b) => b.youReceive - a.youReceive);
    } catch (error) {
      console.error('Error comparing transfers:', error);
      throw error;
    }
  },
};