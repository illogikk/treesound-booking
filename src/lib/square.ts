import { Client, Environment } from 'square';

export const squareClient = () => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN!;
  const env = (process.env.SQUARE_ENV || 'sandbox').toLowerCase();
  return new Client({ accessToken, environment: env === 'production' ? Environment.Production : Environment.Sandbox });
};

export const squareLocationId = () => process.env.SQUARE_LOCATION_ID!;
