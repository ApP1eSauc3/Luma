export interface ExchangeRate {
 from: string;
 to: string;
 rate: number;
 timestamp: string;   
}

export interface TransferOption {
    provider: 'wise' | 'revolut' | 'bank' | 'ofx'; 
    rate: number;
    fee: number;
    youReceive: number;
    transferTime: string;
    providerName: string;
}

export interface Account {
    id: string;
    name: string;
    balance: number;
    currency: string; 
    country: string;
    type: 'bank' | 'wise' | 'revolut' | 'other';
    lastUpdated: string;
}

export interface BankDetail {
  id: string;
  label: string;
  accountNumber: string;
  institution?: string;
  currency: 'AUD' | 'CAD';
  bsb?: string;           // Australian specific
  transitNumber?: string; // Canadian specific
}

export interface RateAlert {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    targetRate: number;
    currentRate: number;
    isActive: boolean;
    createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  from: string;
  to: string;
  amount: number;
  rate: number;
  provider: string;
  status: 'completed' | 'pending' | 'cancelled';
  fromAccountId?: string;
  toAccountId?: string;
}

export interface FinancialGoal {
  id: string;
  currency: string;
  targetAmount: number;
  currentAmount: number;
  isActive: boolean;
  createdAt: string;
}