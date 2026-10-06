import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

import { ReviewPage } from "./review-page";

type Params = Promise<{ runId: string }>;

export const dynamic = "force-dynamic";

export default async function ReviewPageServer({ params }: { params: Params }) {
  const { runId } = await params;
  return <ReviewPage runId={runId} />;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { runId } = await params
  return pageMetadata({
    title: 'Review Training Results',
    description: 'Review model predictions and evaluate training results.',
    path: `/model-service/runs/${encodeURIComponent(runId)}/review`,
    label: 'Training',
  })
}
