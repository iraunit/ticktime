"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Deal } from "@/types";
import { MapPin, Phone, Save } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, handleApiError } from "@/lib/api";

const addressSchema = z.object({
  address_line1: z.string().min(1, "Address line 1 is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  zipcode: z.string().min(1, "ZIP/Postal code is required"),
  country_code: z.string().min(1, "Country code is required").regex(/^\+[1-9]\d{0,2}$/, "Please enter a valid country code (e.g., +1, +91, +44)"),
  phone_number: z.string().min(1, "Phone number is required").regex(/^[1-9][\d\s\-\(\)]{7,15}$/, "Please enter a valid phone number (without country code)"),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressSubmissionProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddressSubmission({ deal, isOpen, onClose, onSuccess }: AddressSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address_line1: deal.shipping_address?.address_line1 || "",
      address_line2: deal.shipping_address?.address_line2 || "",
      city: deal.shipping_address?.city || "",
      state: deal.shipping_address?.state || "",
      country: deal.shipping_address?.country || "India",
      zipcode: deal.shipping_address?.zipcode || "",
      country_code: deal.shipping_address?.country_code || "+91",
      phone_number: deal.shipping_address?.phone_number || "",
    },
  });

  const handleSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      const response = await api.post(`/deals/${deal.id}/submit-address/`, data);
      
      if (response.data && response.data.status === 'success') {
        toast.success("Address submitted successfully!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.data?.message || "Failed to submit address. Please try again.");
      }
    } catch (error: unknown) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-700">
            <MapPin className="h-5 w-5 mr-2" />
            Provide Shipping Address
          </DialogTitle>
          <DialogDescription>
            Please provide your shipping address for product delivery. This information 
            will be shared with <strong>{deal.campaign?.brand?.name}</strong> for shipping purposes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Street address, building name"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Apartment, floor, landmark (optional)"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="City"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="State"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP/Postal Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ZIP Code"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Country"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+91"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            {...field}
                            placeholder="Phone number for delivery"
                            className="pl-10"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Privacy Notice:</strong> Your address will only be used for 
                product delivery and will not be shared with third parties.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Address
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
