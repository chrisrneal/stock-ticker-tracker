import { formatCurrency, formatPercentage, percentageChange } from '../src/utils/formatters';

describe('Formatter Utils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers as currency', () => {
      expect(formatCurrency(100.5)).toBe('$100.50');
      expect(formatCurrency(1234.567)).toBe('$1234.57');
    });

    it('should format zero as currency', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers as currency', () => {
      expect(formatCurrency(-50.25)).toBe('$-50.25');
    });
  });

  describe('percentageChange', () => {
    it('should calculate positive percentage change', () => {
      expect(percentageChange(100, 150)).toBe(50);
      expect(percentageChange(50, 75)).toBe(50);
    });

    it('should calculate negative percentage change', () => {
      expect(percentageChange(100, 75)).toBe(-25);
      expect(percentageChange(200, 150)).toBe(-25);
    });

    it('should return 0 for no change', () => {
      expect(percentageChange(100, 100)).toBe(0);
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentages with plus sign', () => {
      expect(formatPercentage(25.5)).toBe('+25.50%');
      expect(formatPercentage(0.01)).toBe('+0.01%');
    });

    it('should format negative percentages with minus sign', () => {
      expect(formatPercentage(-25.5)).toBe('-25.50%');
      expect(formatPercentage(-0.01)).toBe('-0.01%');
    });

    it('should format zero percentage', () => {
      expect(formatPercentage(0)).toBe('+0.00%');
    });
  });
});
