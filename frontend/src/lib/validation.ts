import * as z from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const phoneSchema = z.string()
  .min(10, 'Please enter a valid phone number')
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number');

export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

// File validation schemas
export const imageFileSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});

export const documentFileSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
      'Only PDF, JPEG, and PNG files are allowed'
    ),
});

export const videoFileSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 100 * 1024 * 1024, 'File size must be less than 100MB')
    .refine(
      (file) => ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'].includes(file.type),
      'Only MP4, WebM, OGG, and MOV videos are allowed'
    ),
});

// Social media validation
export const socialMediaHandleSchema = z.string()
  .min(1, 'Handle is required')
  .max(50, 'Handle must be less than 50 characters')
  .regex(/^[a-zA-Z0-9._]+$/, 'Handle can only contain letters, numbers, dots, and underscores');

export const socialMediaUrlSchema = z.string()
  .url('Please enter a valid URL')
  .optional()
  .or(z.literal(''));

export const followersCountSchema = z.number()
  .min(0, 'Followers count cannot be negative')
  .max(1000000000, 'Please enter a valid followers count');

export const engagementRateSchema = z.number()
  .min(0, 'Engagement rate cannot be negative')
  .max(100, 'Engagement rate cannot exceed 100%');

// Deal and content validation
export const dealValueSchema = z.number()
  .min(0, 'Deal value cannot be negative')
  .max(1000000, 'Please enter a valid deal value');

export const contentCaptionSchema = z.string()
  .max(2200, 'Caption must be less than 2200 characters')
  .optional();

// Form validation helpers
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function getFileValidationError(file: File, maxSizeMB: number, allowedTypes: string[]): string | null {
  if (!validateFileSize(file, maxSizeMB)) {
    return `File size must be less than ${maxSizeMB}MB`;
  }
  
  if (!validateFileType(file, allowedTypes)) {
    const typeNames = allowedTypes.map(type => {
      const parts = type.split('/');
      return parts[1].toUpperCase();
    }).join(', ');
    return `Only ${typeNames} files are allowed`;
  }
  
  return null;
}

// Real-time validation helpers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Custom validation messages
export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  password: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  phone: 'Please enter a valid phone number',
  username: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
  name: 'Name must be 2-50 characters and contain only letters and spaces',
  url: 'Please enter a valid URL',
  fileSize: (maxMB: number) => `File size must be less than ${maxMB}MB`,
  fileType: (types: string[]) => `Only ${types.join(', ')} files are allowed`,
  min: (min: number) => `Must be at least ${min}`,
  max: (max: number) => `Must be no more than ${max}`,
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
};

// Form field validation state
export interface FieldValidationState {
  isValid: boolean;
  error?: string;
  isValidating?: boolean;
}

// Async validation helper
export async function validateAsync<T>(
  value: T,
  validator: (value: T) => Promise<boolean>,
  errorMessage: string
): Promise<FieldValidationState> {
  try {
    const isValid = await validator(value);
    return { isValid, error: isValid ? undefined : errorMessage };
  } catch (error) {
    return { isValid: false, error: 'Validation failed' };
  }
}

// Enhanced form validation with cross-field validation
export function createFormValidator<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  crossFieldValidators?: Array<{
    fields: (keyof T)[];
    validator: (values: Partial<T>) => string | null;
  }>
) {
  return {
    validate: (data: Partial<T>) => {
      const result = schema.safeParse(data);
      const errors: Record<string, string[]> = {};

      // Schema validation errors
      if (!result.success) {
        result.error.issues.forEach((error) => {
          const field = error.path.join('.');
          if (!errors[field]) errors[field] = [];
          errors[field].push(error.message);
        });
      }

      // Cross-field validation errors
      if (crossFieldValidators) {
        crossFieldValidators.forEach(({ fields, validator }) => {
          const fieldValues = fields.reduce((acc, field) => {
            acc[field] = data[field];
            return acc;
          }, {} as Partial<T>);

          const error = validator(fieldValues);
          if (error) {
            fields.forEach((field) => {
              const fieldName = String(field);
              if (!errors[fieldName]) errors[fieldName] = [];
              errors[fieldName].push(error);
            });
          }
        });
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
  };
}

// Client-side validation for common patterns
export const clientValidators = {
  uniqueUsername: async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return false;
    
    try {
      // Simulate API call to check username availability
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation, make API call to check availability
      return !['admin', 'root', 'test'].includes(username.toLowerCase());
    } catch {
      return false;
    }
  },

  uniqueEmail: async (email: string): Promise<boolean> => {
    if (!emailSchema.safeParse(email).success) return false;
    
    try {
      // Simulate API call to check email availability
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation, make API call to check availability
      return true;
    } catch {
      return false;
    }
  },

  strongPassword: (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  },

  passwordMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword && password.length > 0;
  },
};