import { Scorecard } from '@/components/scorecard';
import { notFound } from 'next/navigation';
import { z } from 'zod';
export const metadata = { title: 'Live scorecard', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <Scorecard key={id} id={id} />;
}
