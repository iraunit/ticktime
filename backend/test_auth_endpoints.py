#!/usr/bin/env python
"""
Simple script to test authentication endpoints manually.
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_signup():
    """Test user signup endpoint."""
    print("Testing signup endpoint...")
    
    data = {
        'first_name': 'Test',
        'last_name': 'User',
        'email': 'test@example.com',
        'password': 'TestPassword123!',
        'password_confirm': 'TestPassword123!',
        'phone_number': '+1234567890',
        'username': 'testuser',
        'industry': 'tech_gaming'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup/", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    """Test user login endpoint."""
    print("\nTesting login endpoint...")
    
    data = {
        'email': 'test@example.com',
        'password': 'TestPassword123!',
        'remember_me': False
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            return response.json().get('access_token')
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_profile(access_token):
    """Test user profile endpoint."""
    print("\nTesting profile endpoint...")
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    try:
        response = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_forgot_password():
    """Test forgot password endpoint."""
    print("\nTesting forgot password endpoint...")
    
    data = {
        'email': 'test@example.com'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/forgot-password/", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Authentication Endpoints")
    print("=" * 40)
    
    # Test signup
    signup_success = test_signup()
    
    if signup_success:
        print("✓ Signup test passed")
    else:
        print("✗ Signup test failed")
    
    # Test login (will fail because email not verified, but endpoint should work)
    access_token = test_login()
    
    if access_token:
        print("✓ Login test passed")
        
        # Test profile
        profile_success = test_profile(access_token)
        if profile_success:
            print("✓ Profile test passed")
        else:
            print("✗ Profile test failed")
    else:
        print("✗ Login test failed (expected - email not verified)")
    
    # Test forgot password
    forgot_success = test_forgot_password()
    if forgot_success:
        print("✓ Forgot password test passed")
    else:
        print("✗ Forgot password test failed")
    
    print("\nAll endpoint tests completed!")