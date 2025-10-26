"use client";

import Link from "next/link";
import {useUserContext} from "@/components/providers/app-providers";
import {Button} from "@/components/ui/button";
import {HiArrowLeft, HiHome} from "react-icons/hi2";
import {getDashboardRoute} from "@/lib/redirect-utils";

export default function NotFound() {
    const {user} = useUserContext();

    // Determine the correct dashboard URL based on user type
    const dashboardUrl = getDashboardRoute(user);
    const dashboardLabel = user?.account_type === 'brand' ? 'Brand Dashboard' : 'Dashboard';

    return (
        <div
            className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="text-center max-w-md">
                {/* Error Icon */}
                <div
                    className="w-24 h-24 bg-gradient-to-br from-red-50 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl font-bold text-red-600">404</span>
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
                <p className="text-gray-600 mb-8">
                    The page you're looking for doesn't exist or may have been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {user ? (
                        <Link href={dashboardUrl}>
                            <Button
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                <HiHome className="w-4 h-4 mr-2"/>
                                Go to {dashboardLabel}
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/">
                            <Button
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                <HiHome className="w-4 h-4 mr-2"/>
                                Go to Home
                            </Button>
                        </Link>
                    )}

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
                        onClick={() => window.history.back()}
                    >
                        <HiArrowLeft className="w-4 h-4 mr-2"/>
                        Go Back
                    </Button>
                </div>

                {/* Additional Help */}
                <div className="mt-8 text-sm text-gray-500">
                    <p>
                        If you think this is an error, please{" "}
                        <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline">
                            contact support
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
} 