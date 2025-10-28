// Simple currency conversion utility
// In a real app, you'd use a live exchange rate API

const exchangeRates: Record<string, { rate: number; symbol: string; name: string }> = {
  'canada': { rate: 1.35, symbol: 'CAD', name: 'Canadian Dollar' },
  'united-states': { rate: 1.0, symbol: 'USD', name: 'US Dollar' },
  'mexico': { rate: 17.5, symbol: 'MXN', name: 'Mexican Peso' },
  'united-kingdom': { rate: 0.79, symbol: 'GBP', name: 'British Pound' },
  'germany': { rate: 0.92, symbol: 'EUR', name: 'Euro' },
  'france': { rate: 0.92, symbol: 'EUR', name: 'Euro' },
  'spain': { rate: 0.92, symbol: 'EUR', name: 'Euro' },
  'italy': { rate: 0.92, symbol: 'EUR', name: 'Euro' },
  'netherlands': { rate: 0.92, symbol: 'EUR', name: 'Euro' },
  'australia': { rate: 1.52, symbol: 'AUD', name: 'Australian Dollar' },
  'japan': { rate: 149.0, symbol: 'JPY', name: 'Japanese Yen' },
  'south-korea': { rate: 1320.0, symbol: 'KRW', name: 'South Korean Won' },
  'china': { rate: 7.2, symbol: 'CNY', name: 'Chinese Yuan' },
  'india': { rate: 83.0, symbol: 'INR', name: 'Indian Rupee' },
  'brazil': { rate: 5.0, symbol: 'BRL', name: 'Brazilian Real' },
  'singapore': { rate: 1.35, symbol: 'SGD', name: 'Singapore Dollar' },
};

export function convertCurrency(usdAmount: number, countryCode: string): {
  amount: string;
  symbol: string;
  name: string;
} | null {
  const currency = exchangeRates[countryCode];
  if (!currency) {
    return null;
  }

  const convertedAmount = usdAmount * currency.rate;
  
  // Format based on currency
  let formattedAmount: string;
  if (currency.symbol === 'JPY' || currency.symbol === 'KRW') {
    formattedAmount = Math.round(convertedAmount).toLocaleString();
  } else {
    formattedAmount = convertedAmount.toFixed(2);
  }

  return {
    amount: formattedAmount,
    symbol: currency.symbol,
    name: currency.name
  };
}