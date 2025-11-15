"use client";

import {useRouter} from "next/navigation";
import {HiCloudArrowUp, HiShieldCheck} from "react-icons/hi2";
import {Button} from "@/components/ui/button";
import {BrandVerificationUploader} from "@/components/brand/brand-verification-uploader";

interface BrandVerificationModalProps {
    gstinProvided: boolean;
    hasDocument: boolean;
    uploadedAt?: string | null;
    onUploaded: () => void;
}

export function BrandVerificationModal({
                                           gstinProvided,
                                           hasDocument,
                                           uploadedAt,
                                           onUploaded,
                                       }: BrandVerificationModalProps) {
    const router = useRouter();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                            <HiShieldCheck className="w-7 h-7 text-indigo-600"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">Brand Verification Required</h2>
                            <p className="text-gray-600">
                                Upload a legal document (PAN, Aadhaar, GST certificate, or incorporation document)
                                so our team can unlock your brand account.
                            </p>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
                        <p className="font-semibold mb-1">Why am I seeing this?</p>
                        <p>
                            {gstinProvided
                                ? "We still need supporting documentation to verify your business before you can create campaigns."
                                : "We don't have a GSTIN on file for your brand, so we require a document upload to verify ownership."}
                        </p>
                        <ul className="list-disc pl-5 mt-3 space-y-1">
                            <li>You cannot create campaigns, manage deals, or invite teammates until verification is
                                complete.
                            </li>
                            <li>Verification usually takes 1-2 business days after document submission.</li>
                        </ul>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <HiCloudArrowUp className="w-5 h-5 text-gray-700"/>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Upload Verification Document</p>
                                {hasDocument && uploadedAt ? (
                                    <p className="text-sm text-gray-600">
                                        Last uploaded on {new Date(uploadedAt).toLocaleDateString()}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-600">Accepted formats: PDF, JPG, JPEG, PNG, WebP
                                        (max
                                        1MB)</p>
                                )}
                            </div>
                        </div>

                        <BrandVerificationUploader
                            variant="modal"
                            hasDocument={hasDocument}
                            uploadedAt={uploadedAt}
                            onUploaded={() => onUploaded()}
                        />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-500">
                            Need help? Contact{" "}
                            <a href="mailto:support@ticktime.media" className="text-indigo-600 hover:underline">
                                support@ticktime.media
                            </a>
                        </p>
                        <Button variant="outline" onClick={() => router.push("/brand/settings")}>
                            Go to Settings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

