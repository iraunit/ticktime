import {DealDetailsContent} from "./deal-details-content";

interface InfluencerDealDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function InfluencerDealDetailsPage({params}: InfluencerDealDetailsPageProps) {
    const {id} = await params;

    return (
        <div className="container mx-auto px-4 py-4 max-w-7xl">
            <DealDetailsContent dealId={parseInt(id)}/>
        </div>
    );
}
