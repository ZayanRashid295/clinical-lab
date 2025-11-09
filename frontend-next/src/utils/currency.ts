/**
 * Currency utility functions for handling amounts that can be strings or numbers
 * (common with Prisma Decimal fields)
 */

/**
 * Safely converts an amount to a number, handling both string and number inputs
 * @param amount - The amount to convert (string or number)
 * @returns The numeric amount
 */
export const toNumber = (amount: string | number): number => {
  if (typeof amount === "number") {
    return amount;
  }
  if (typeof amount === "string") {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Formats a currency amount, handling both string and number inputs
 * @param amount - The amount to format (string or number)
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: string | number,
  currency: string = "USD"
): string => {
  const numericAmount = toNumber(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(numericAmount);
};

/**
 * Formats a number with a fixed number of decimal places
 * @param amount - The amount to format (string or number)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (
  amount: string | number,
  decimals: number = 2
): string => {
  const numericAmount = toNumber(amount);
  return numericAmount.toFixed(decimals);
};

/**
 * Calculates the sum of an array of amounts, handling string/number mixed arrays
 * @param amounts - Array of amounts to sum
 * @returns The total sum as a number
 */
export const sumAmounts = (amounts: (string | number)[]): number => {
  return amounts.reduce((sum: number, amount) => sum + toNumber(amount), 0);
};

/**
 * Safely compares two amounts
 * @param amount1 - First amount
 * @param amount2 - Second amount
 * @returns -1 if amount1 < amount2, 0 if equal, 1 if amount1 > amount2
 */
export const compareAmounts = (
  amount1: string | number,
  amount2: string | number
): number => {
  const num1 = toNumber(amount1);
  const num2 = toNumber(amount2);

  if (num1 < num2) return -1;
  if (num1 > num2) return 1;
  return 0;
};
