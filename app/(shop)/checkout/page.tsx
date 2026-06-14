import { Suspense } from 'react';
import CheckoutPage from './CheckoutPage';

export default function Page() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  );
}