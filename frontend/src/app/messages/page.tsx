"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ConversationList, MessagingInterface } from "@/components/messaging";
import { Deal } from "@/types";
import { HiChatBubbleLeftRight, HiArrowLeft } from "react-icons/hi2";
import { RequireAuth } from "@/components/auth/require-auth";

export default function MessagesPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);


  const handleSelectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  return (
    <RequireAuth>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">

            
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