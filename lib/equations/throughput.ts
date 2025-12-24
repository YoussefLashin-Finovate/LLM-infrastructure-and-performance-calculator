import { DEFAULT_REQUEST_FREQUENCY } from './constants';

export interface ContinuousServingRate {
  decodeRate: number;
  prefillRate: number;
  totalRate: number;
  decodePercentage: number;
}

export function calculateContinuousServingRate(
  users: number,
  decodeRatePerUser: number,
  prefillTokens: number,
  requestsPerSecPerUser: number = DEFAULT_REQUEST_FREQUENCY
): ContinuousServingRate {
  const decodeRate = users * decodeRatePerUser;
  const prefillRate = users * prefillTokens * requestsPerSecPerUser;
  const totalRate = decodeRate + prefillRate;
  return {
    decodeRate,
    prefillRate,
    totalRate,
    decodePercentage: (decodeRate / totalRate) * 100
  };
}
