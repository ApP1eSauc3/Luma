import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, RateAlert, Transaction, BankDetail, FinancialGoal } from '../types';
import * as Keychain from 'react-native-keychain';

const KEYS = {
  ACCOUNTS: '@accounts_data',
  ALERTS: '@rate_alerts',
  TRANSACTIONS: '@transactions',
  LAST_RATES: '@last_rates',
  BANK_VAULT: '@bank_vault_data',
  GOALS: '@financial_goals',
};

export const storageService = {
  async getAccounts(): Promise<Account[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  },

  async saveAccount(account: Account): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const existingIndex = accounts.findIndex(a => a.id === account.id);

      if (existingIndex >= 0) {
        accounts[existingIndex] = account;
      } else {
        accounts.push(account);
      }

      await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving account:', error);
      throw error;
    }
  },

  async deleteAccount(id: string): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const filtered = accounts.filter(a => a.id !== id);
      await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  async getBankDetails(): Promise<BankDetail[]> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: 'bank_vault' });
    if (!credentials) return [];
    return JSON.parse(credentials.password);
    } catch (error) {
      console.error('Error getting bank details:', error);
      return [];
    }
  },

  async saveBankDetail(detail: BankDetail): Promise<void> {
    try {
      const details = await this.getBankDetails();
      const existingIndex = details.findIndex(d => d.id === detail.id);
      if (existingIndex >= 0) {
        details[existingIndex] = detail;
      } else {
        details.push(detail);
      }
      await Keychain.setGenericPassword('bank_vault', JSON.stringify(details), { service: 'bank_vault' });
    } catch (error) {
      console.error('Error saving bank detail:', error);
      throw error;
    }
  },

  async deleteBankDetail(id: string): Promise<void> {
    try {
      const details = await this.getBankDetails();
      const filtered = details.filter(d => d.id !== id);
      await Keychain.setGenericPassword('bank_vault', JSON.stringify(filtered),  { service: 'bank_vault' });
    } catch (error) {
      console.error('Error deleting bank detail:', error);
      throw error;
    }
  },

  async getAlerts(): Promise<RateAlert[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ALERTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  },

  async saveAlert(alert: RateAlert): Promise<void> {
    try {
      const alerts = await this.getAlerts();
      const existingIndex = alerts.findIndex(a => a.id === alert.id);

      if (existingIndex >= 0) {
        alerts[existingIndex] = alert;
      } else {
        alerts.push(alert);
      }

      await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving alert:', error);
      throw error;
    }
  },

  async deleteAlert(id: string): Promise<void> {
    try {
      const alerts = await this.getAlerts();
      const filtered = alerts.filter(a => a.id !== id);
      await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const accounts = await this.getAccounts();
      const goals = await this.getGoals();

      transactions.unshift(transaction);

      
      if (transaction.fromAccountId) {
        const fromAcc = accounts.find(a => a.id === transaction.fromAccountId);
        if (fromAcc) {
          fromAcc.balance -= transaction.amount;
          fromAcc.lastUpdated = new Date().toISOString();
        }
      }

      if (transaction.toAccountId) {
        const toAcc = accounts.find(a => a.id === transaction.toAccountId);
        if (toAcc) {
          toAcc.balance += transaction.amount * transaction.rate;
          toAcc.lastUpdated = new Date().toISOString();
        }
      }

     
      const activeGoal = goals.find(
        g => g.isActive && g.currency === transaction.to
      );
      if (activeGoal) {
        activeGoal.currentAmount += transaction.amount * transaction.rate;
      }

      await Promise.all([
        AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions)),
        AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts)),
        AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals)),
      ]);
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  },

  async getGoals(): Promise<FinancialGoal[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.GOALS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting goals:', error);
      return [];
    }
  },

  async saveGoal(goal: FinancialGoal): Promise<void> {
    try {
      const goals = await this.getGoals();
      const existingIndex = goals.findIndex(g => g.id === goal.id);

      if (existingIndex >= 0) {
        goals[existingIndex] = goal;
      } else {
        goals.push(goal);
      }

      await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error; // Fixed: was swallowing error silently
    }
  },
};