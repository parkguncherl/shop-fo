import type { Metadata } from 'next';
import ProductDet from '@/app/(shop)/products/[category]/[productId]/ProductDet';

const API = process.env.NEXT_PUBLIC_SHOP_API_ENDPOINT;
const SITE_URL = process.env.NEXT_BASE_URL ?? 'https://mapsiggun.com';
const SITE_NAME = '맵시꾼';

async function fetchProduct(productId: string) {
  try {
    const res = await fetch(`${API}/frontWeb/product/productDetail?productId=${productId}`, {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    return json?.resultCode === 200 ? json.body : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; productId: string }> }): Promise<Metadata> {
  const { category, productId } = await params;
  const product = await fetchProduct(productId);

  const title = product?.prodNm ? `${product.prodNm} | ${SITE_NAME}` : SITE_NAME;
  const description = product?.prodNm ? `${product.prodNm} - 맵시꾼 온라인 쇼핑몰에서 만나보세요.` : '맵시꾼 온라인 쇼핑몰';
  const imageUrl = product?.repSysFileNm ? `${API}/common/file/view?sysFileNm=${product.repSysFileNm}` : `${SITE_URL}/og-default.jpg`;
  const pageUrl = `${SITE_URL}/products/${category}/${productId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 800, height: 800, alt: product?.prodNm ?? SITE_NAME }],
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: pageUrl },
  };
}

const page = async ({ params }: { params: Promise<{ category: string; productId: string }> }) => {
  const { category, productId } = await params;
  const product = await fetchProduct(productId);

  const pageUrl = `${SITE_URL}/products/${category}/${productId}`;
  const imageUrl = product?.repSysFileNm ? `${API}/common/file/view?sysFileNm=${product.repSysFileNm}` : null;

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.prodNm,
        url: pageUrl,
        ...(imageUrl ? { image: imageUrl } : {}),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'KRW',
          price: product.sellAmt ?? 0,
          availability: 'https://schema.org/InStock',
          url: pageUrl,
        },
      }
    : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <ProductDet productId={Number(productId)} />
    </>
  );
};

export default page;
