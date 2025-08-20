"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ConversationList, MessagingInterface } from "@/components/messaging";
import { Deal } from "@/types";
import { HiChatBubbleLeftRight, HiArrowLeft } from "react-icons/hi2";
import { RequireInfluencerAuth } from "@/components/auth/require-influencer-auth";

export default function MessagesPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  const handleBackToList = () => {
    setSelectedDeal(null);
  };

  return (
    <RequireInfluencerAuth>
      <MainLayout showFooter={false}>
        <div className="h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden p-3">
          <div className="h-full flex gap-3">
            {/* Desktop: Two-column layout */}
            <div className="hidden lg:flex w-full gap-3">
              {/* Conversation List - Desktop */}
              <div className="w-1/3 h-full">
                <ConversationList
                  selectedDealId={selectedDeal?.id}
                  onSelectDeal={handleSelectDeal}
                />
              </div>

              {/* Messaging Interface - Desktop */}
              <div className="w-2/3 h-full">
                {selectedDeal ? (
                  <MessagingInterface deal={selectedDeal} />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <HiChatBubbleLeftRight className="w-8 h-8 text-purple-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                        Choose a conversation from the list to start messaging with brands and manage your collaborations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Facebook Messenger-style layout */}
            <div className="lg:hidden w-full h-full">
              {/* Conversation List - Mobile (full screen when no conversation selected) */}
              <div className={`h-full ${selectedDeal ? 'hidden' : 'block'}`}>
                <ConversationList
                  selectedDealId={selectedDeal?.id}
                  onSelectDeal={handleSelectDeal}
                />
              </div>

              {/* Messaging Interface - Mobile (full screen when conversation selected) */}
              <div className={`h-full ${selectedDeal ? 'block' : 'hidden'}`}>
                {selectedDeal && (
                  <div className="relative h-full">
                    {/* Mobile back button */}
                    <div className="absolute top-3 left-3 z-10">
                      <button
                        onClick={handleBackToList}
                        className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200"
                      >
                        <HiArrowLeft className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                    <MessagingInterface deal={selectedDeal} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </RequireInfluencerAuth>
  );
}