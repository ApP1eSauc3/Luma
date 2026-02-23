export const CURRENCIES = {
  CAD: { symbol: '$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: '$', name: 'Australian Dollar', flag: '🇦🇺' },
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
};

export const formatCurrency = (
  amount: number,
  currency: string,
  showSymbol: boolean = true
): string => {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (showSymbol && CURRENCIES[currency as keyof typeof CURRENCIES]) {
    return `${CURRENCIES[currency as keyof typeof CURRENCIES].symbol}${formatted}`;
  }

  return formatted;
};

export const convertCurrency = (
  amount: number,
  rate: number
): number => {
  return amount * rate;
};

export const calculateFee = (
  amount: number,
  provider: string
): number => {
  // Fee structures (simplified)
  const feeStructures = {
    wise: { percentage: 0.0068, minimum: 0.5 },
    revolut: { percentage: 0, minimum: 0 }, // Free up to limit
    bank: { percentage: 0.03, minimum: 15 },
    ofx: { percentage: 0.01, minimum: 5 },
  };

  const structure = feeStructures[provider as keyof typeof feeStructures];
  const calculatedFee = amount * structure.percentage;
  return Math.max(calculatedFee, structure.minimum);
};