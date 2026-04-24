// lib/publicApi.ts
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_SHOP_API_ENDPOINT;

const publicApi = axios.create({
  baseURL: baseURL,
});

export default publicApi;
