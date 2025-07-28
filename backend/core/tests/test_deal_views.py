import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
class TestDealViews:
    def test_get_deals_list(self, authenticated_client, deal):
        """Test getting list of deals."""
        url = reverse('deals-list')
        
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == deal.id

    def test_get_deals_filtered_by_status(self, authenticated_client, deal):
        """Test getting deals filtered by status."""
        url = reverse('deals-list')
        
        response = authenticated_client.get(url, {'status': 'invited'})
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        
        # Test with different status
        response = authenticated_client.get(url, {'status': 'accepted'})
        assert response.data['count'] == 0

    def test_get_deal_detail(self, authenticated_client, deal):
        """Test getting deal details."""
        url = reverse('deal-detail', kwargs={'pk': deal.id})
        
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == deal.id
        assert response.data['campaign']['title'] == deal.campaign.title
        assert response.data['status'] == deal.status

    def test_get_deal_detail_not_found(self, authenticated_client):
        """Test getting non-existent deal."""
        url = reverse('deal-detail', kwargs={'pk': 999})
        
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_accept_deal(self, authenticated_client, deal):
        """Test accepting a deal."""
        url = reverse('deal-accept', kwargs={'pk': deal.id})
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Deal accepted successfully'
        
        # Check deal status was updated
        deal.refresh_from_db()
        assert deal.status == 'accepted'
        assert deal.responded_at is not None

    def test_accept_already_responded_deal(self, authenticated_client, deal):
        """Test accepting a deal that was already responded to."""
        deal.status = 'accepted'
        deal.save()
        
        url = reverse('deal-accept', kwargs={'pk': deal.id})
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already responded' in str(response.data).lower()

    def test_reject_deal(self, authenticated_client, deal):
        """Test rejecting a deal."""
        url = reverse('deal-reject', kwargs={'pk': deal.id})
        data = {'reason': 'Not interested in this campaign'}
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['message'] == 'Deal rejected successfully'
        
        # Check deal status was updated
        deal.refresh_from_db()
        assert deal.status == 'rejected'
        assert deal.responded_at is not None

    def test_reject_deal_without_reason(self, authenticated_client, deal):
        """Test rejecting a deal without providing reason."""
        url = reverse('deal-reject', kwargs={'pk': deal.id})
        
        response = authenticated_client.post(url, {}, format='json')
        
        # Should still work, reason is optional
        assert response.status_code == status.HTTP_200_OK
        
        deal.refresh_from_db()
        assert deal.status == 'rejected'

    def test_submit_content(self, authenticated_client, deal):
        """Test submitting content for a deal."""
        # First accept the deal
        deal.status = 'accepted'
        deal.save()
        
        url = reverse('deal-submit-content', kwargs={'pk': deal.id})
        data = {
            'platform': 'instagram',
            'content_type': 'post',
            'caption': 'Check out this amazing product!',
            'file_url': 'https://example.com/content.jpg'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['message'] == 'Content submitted successfully'
        
        # Check deal status was updated
        deal.refresh_from_db()
        assert deal.status == 'content_submitted'

    def test_submit_content_for_unaccepted_deal(self, authenticated_client, deal):
        """Test submitting content for a deal that hasn't been accepted."""
        url = reverse('deal-submit-content', kwargs={'pk': deal.id})
        data = {
            'platform': 'instagram',
            'content_type': 'post',
            'caption': 'Test caption'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'must be accepted' in str(response.data).lower()

    def test_unauthorized_access(self, api_client, deal):
        """Test accessing deals without authentication."""
        url = reverse('deals-list')
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED