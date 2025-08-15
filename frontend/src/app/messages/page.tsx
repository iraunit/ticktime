"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ConversationList, MessagingInterface } from "@/components/messaging";
import { Deal } from "@/types";
import { HiChatBubbleLeftRight, HiArrowLeft, HiXMark } from "react-icons/hi2";
import { RequireAuth } from "@/components/auth/require-auth";

export default function MessagesPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  // Load banner state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('messages-banner-hidden');
    if (saved === 'true') {
      setBannerVisible(false);
    }
  }, []);

  // Save banner state to localStorage
  const handleCloseBanner = () => {
    setBannerVisible(false);
    localStorage.setItem('messages-banner-hidden', 'true');
  };

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  return (
    <RequireAuth>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
            {/* Enhanced Header with Close Button */}
            {bannerVisible && (
              <div className="relative mb-6 sm:mb-8">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-indigo-500/5 rounded-xl sm:rounded-2xl -m-2 sm:-m-4"></div>
                
                <div className="relative p-4 sm:p-6">
                  {/* Close Button */}
                  <button
                    onClick={handleCloseBanner}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-lg bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 z-10"
                    aria-label="Close banner"
                  >
                    <HiXMark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-gray-800" />
                  </button>

                  <div className="flex items-start sm:items-center mb-3 sm:mb-4 pr-8 sm:pr-12">
                    <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3 sm:mr-4 flex-shrink-0"></div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
                      Messages 💬
                    </h1>
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
                    Stay connected with brands and manage all your collaboration conversations in one place.
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)]">
              {/* Conversation List - Enhanced with modern styling */}
              <div className={`lg:col-span-1 ${selectedDeal ? 'hidden lg:block' : 'block'}`}>
                <ConversationList
                  selectedDealId={selectedDeal?.id}
                  onSelectDeal={handleSelectDeal}
                />
              </div>

              {/* Messaging Interface - Enhanced with modern styling */}
              <div className={`lg:col-span-2 ${selectedDeal ? 'block' : 'hidden lg:block'}`}>
                {selectedDeal ? (
                  <div className="relative h-full">
                    {/* Mobile back button - Enhanced styling */}
                    <div className="lg:hidden absolute top-4 left-4 z-10">
                      <button
                        onClick={() => setSelectedDeal(null)}
                        className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200"
                      >
                        <HiArrowLeft className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>
                    <MessagingInterface deal={selectedDeal} />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg border h-full flex items-center justify-center">
                    <div className="text-center p-6 sm:p-8">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                        <HiChatBubbleLeftRight className="w-8 sm:w-10 h-8 sm:h-10 text-purple-500" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                        Select a conversation
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto leading-relaxed">
                        Choose a conversation from the list to start messaging with brands and manage your collaborations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </RequireAuth>
  );
}