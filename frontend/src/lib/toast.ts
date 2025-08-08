// Simple toast utility
export const toast = {
  success: (message: string) => {
    console.log("✅ Success:", message);
    // In a real implementation, this would show a toast notification
    // For now, we'll just log to console
  },
  error: (message: string) => {
    console.error("❌ Error:", message);
    // In a real implementation, this would show an error toast
    // For now, we'll just log to console
  },
  info: (message: string) => {
    console.info("ℹ️ Info:", message);
    // In a real implementation, this would show an info toast
    // For now, we'll just log to console
  },
};