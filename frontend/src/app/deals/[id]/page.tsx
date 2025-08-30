import {MainLayout} from "@/components/layout/main-layout";
import {DealDetailsContent} from "./deal-details-content";

interface DealDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DealDetailsPage({params}: DealDetailsPageProps) {
    const {id} = await params;

    return (
        <MainLayout showFooter={false}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    <DealDetailsContent dealId={parseInt(id)}/>
                </div>
            </div>
        </MainLayout>
    );
}