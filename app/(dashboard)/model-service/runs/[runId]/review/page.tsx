import { ReviewPage } from "./review-page";

type Params = Promise<{ runId: string }>;

export const dynamic = "force-dynamic";

export default async function ReviewPageServer({ params }: { params: Params }) {
  const { runId } = await params;
  return <ReviewPage runId={runId} />;
}
