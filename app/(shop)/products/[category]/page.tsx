import Category from '@/app/(shop)/products/[category]/Category';


/**
 * (server side) (dynamic) contents page
 * */
const page = async ({ params }: { params: Promise<{ category: string }> }) => {
  const { category } = await params;

  return <Category codeCd={category} />;
};

export default page;
