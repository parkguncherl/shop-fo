import ProductDet from '@/app/(shop)/products/[category]/[productId]/ProductDet';

const page = async ({ params }: { params: Promise<{ category: string; productId: string }> }) => {
  const { productId } = await params;
  return <ProductDet productId={Number(productId)} />;
};

export default page;
