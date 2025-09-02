"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/profile/image-upload';
import { useProfile } from '@/hooks/use-profile';
import { useUserContext } from '@/components/providers/app-providers';
import { getMediaUrl } from '@/lib/utils';
import { HiCamera, HiUser } from 'react-icons/hi2';

export function ProfileAvatarSection() {
  const { user } = useUserContext();
  const { profile } = useProfile();
  const [isUploading, setIsUploading] = useState(false);

  const profileImage = profile.data?.profile_image;
  const profileImageUrl = getMediaUrl(profileImage);
  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
  const userInitials = `${user?.first_name?.charAt(0) || ''}${user?.last_name?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="text-center space-y-4">
      {/* Avatar */}
      <div className="relative inline-block">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-white text-xl font-bold">
              {userInitials || <HiUser className="w-8 h-8" />}
            </div>
          )}
        </div>
        
        {/* Upload button overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer">
          <HiCamera className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* User Info */}
      <div>
        <h3 className="font-semibold text-gray-900">{userName}</h3>
        <p className="text-sm text-gray-600">
          {user?.email}
        </p>
        {profile.data?.bio && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-3">
            {profile.data.bio}
          </p>
        )}
      </div>

      {/* Upload Component */}
      <div className="space-y-2">
        <ImageUpload
          onImageSelect={(file: File) => {
            setIsUploading(true);
            // Handle the file upload logic here
            console.log('Selected file:', file);
            setIsUploading(false);
          }}
          className="w-full"
        />
        {isUploading && (
          <p className="text-xs text-gray-500">Uploading profile image...</p>
        )}
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {profile.data?.social_accounts?.length || 0}
          </p>
          <p className="text-xs text-gray-600">Social Accounts</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {profile.data?.content_categories?.length || 0}
          </p>
          <p className="text-xs text-gray-600">Categories</p>
        </div>
      </div>
    </div>
  );
}
