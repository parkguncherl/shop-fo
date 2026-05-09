import { Configuration } from '@/generated/configuration';

export const apiConfig = new Configuration({
  basePath: process.env.NEXT_PUBLIC_SMART_API_ENDPOINT,
});
