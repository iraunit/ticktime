from brands.models import Brand
from deals.models import Deal
from django.core.management.base import BaseCommand
from django.db.models import Avg
from influencers.models import InfluencerProfile


class Command(BaseCommand):
    help = 'Recalculate all brand and influencer ratings from completed deals'

    def handle(self, *args, **options):
        self.stdout.write('Starting rating recalculation...')

        # Recalculate brand ratings
        brands_updated = 0
        for brand in Brand.objects.all():
            # Calculate average rating from influencer ratings
            avg_rating_result = Deal.objects.filter(
                campaign__brand=brand,
                status='completed',
                influencer_rating__isnull=False
            ).aggregate(avg_rating=Avg('influencer_rating'))

            avg_rating = avg_rating_result['avg_rating'] or 0
            total_campaigns = Deal.objects.filter(
                campaign__brand=brand,
                status='completed'
            ).count()

            brand.rating = avg_rating
            brand.total_campaigns = total_campaigns
            brand.save(update_fields=['rating', 'total_campaigns'])
            brands_updated += 1

        self.stdout.write(f'Updated {brands_updated} brands')

        # Recalculate influencer ratings
        influencers_updated = 0
        for influencer in InfluencerProfile.objects.all():
            # Calculate average rating from brand ratings
            avg_rating_result = Deal.objects.filter(
                influencer=influencer,
                status='completed',
                brand_rating__isnull=False
            ).aggregate(avg_rating=Avg('brand_rating'))

            avg_rating = avg_rating_result['avg_rating'] or 0
            collaboration_count = Deal.objects.filter(
                influencer=influencer,
                status='completed'
            ).count()

            influencer.avg_rating = avg_rating
            influencer.collaboration_count = collaboration_count
            influencer.save(update_fields=['avg_rating', 'collaboration_count'])
            influencers_updated += 1

        self.stdout.write(f'Updated {influencers_updated} influencers')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully recalculated ratings for {brands_updated} brands and {influencers_updated} influencers'
            )
        )
