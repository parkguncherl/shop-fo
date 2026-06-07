import type { Metadata } from 'next';
import CartPage from './CartPage';

export const metadata: Metadata = { title: '장바구니' };

export default function Page() {
  return <CartPage />;
}
