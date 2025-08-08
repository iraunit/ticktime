import { MainLayout } from "@/components/layout/main-layout";
import { DealDetailsContent } from "./deal-details-content";

interface DealDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DealDetailsPage({ params }: DealDetailsPageProps) {
  const { id } = await params;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <DealDetailsContent dealId={parseInt(id)} />
      </div>
    </MainLayout>
  );
}