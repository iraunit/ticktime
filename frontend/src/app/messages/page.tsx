"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ConversationList, MessagingInterface } from "@/components/messaging";
import { Deal } from "@/types";
import { MessageCircle } from "@/lib/icons";
import { RequireAuth } from "@/components/auth/require-auth";

export default function MessagesPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const handleSelectDeal = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  return (
    <RequireAuth>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversation List - Hidden on mobile when a deal is selected */}
            <div className={`lg:col-span-1 ${selectedDeal ? 'hidden lg:block' : 'block'}`}>
              <ConversationList
                selectedDealId={selectedDeal?.id}
                onSelectDeal={handleSelectDeal}
              />
            </div>

            {/* Messaging Interface - Full width on mobile when deal is selected */}
            <div className={`lg:col-span-2 ${selectedDeal ? 'block' : 'hidden lg:block'}`}>
              {selectedDeal ? (
                <div className="relative">
                  {/* Mobile back button */}
                  <div className="lg:hidden absolute top-4 left-4 z-10">
                    <button
                      onClick={() => setSelectedDeal(null)}
                      className="bg-white rounded-full p-2 shadow-md border border-gray-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                  <MessagingInterface deal={selectedDeal} />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    </RequireAuth>
  );
}