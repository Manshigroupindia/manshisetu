// Cloudinary Asset Upload Service for Manshi Group Setu

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  originalFilename: string;
  bytes: number;
  createdAt: string;
}

export type AssetFolder =
  | 'manshi-setu/profile-photos'
  | 'manshi-setu/company-assets'
  | 'manshi-setu/expense-receipts'
  | 'manshi-setu/task-attachments'
  | 'manshi-setu/shared-documents';

export interface UploadOptions {
  folder?: AssetFolder;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  onProgress?: (progressPercent: number) => void;
}

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'tllrwznv';
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'manshisetu';
const CLOUDINARY_API_KEY =
  import.meta.env.VITE_CLOUDINARY_API_KEY || '139227391238254';

export class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;

  constructor() {
    this.cloudName = CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = CLOUDINARY_UPLOAD_PRESET;
    this.apiKey = CLOUDINARY_API_KEY;
  }

  /**
   * Upload a file to Cloudinary using the configured unsigned upload preset.
   */
  async uploadFile(
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    const {
      folder = 'manshi-setu/shared-documents',
      maxSizeBytes = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
      onProgress,
    } = options;

    // Validate size
    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum permitted limit of ${maxMb}MB.`);
    }

    // Validate mime type if file has type
    if (file.type && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      throw new Error(`File type "${file.type}" is not supported. Permitted types: ${allowedTypes.join(', ')}.`);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('api_key', this.apiKey);
    if (folder) {
      formData.append('folder', folder);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              url: data.url,
              secureUrl: data.secure_url || data.url,
              publicId: data.public_id,
              format: data.format,
              resourceType: data.resource_type,
              originalFilename: data.original_filename || (file instanceof File ? file.name : 'upload'),
              bytes: data.bytes || file.size,
              createdAt: data.created_at || new Date().toISOString(),
            });
          } catch (err) {
            reject(new Error('Failed to parse Cloudinary upload response.'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData?.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during Cloudinary asset upload. Please check your internet connection.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Cloudinary asset upload timed out. Please try again.'));
      };

      xhr.send(formData);
    });
  }

  /**
   * Helper to upload staff profile picture
   */
  async uploadProfilePhoto(file: File, onProgress?: (p: number) => void): Promise<CloudinaryUploadResult> {
    return this.uploadFile(file, {
      folder: 'manshi-setu/profile-photos',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSizeBytes: 5 * 1024 * 1024,
      onProgress,
    });
  }

  /**
   * Helper to upload company logo
   */
  async uploadCompanyLogo(file: File, onProgress?: (p: number) => void): Promise<CloudinaryUploadResult> {
    return this.uploadFile(file, {
      folder: 'manshi-setu/company-assets',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      maxSizeBytes: 5 * 1024 * 1024,
      onProgress,
    });
  }

  /**
   * Helper to upload expense receipts
   */
  async uploadExpenseReceipt(file: File, onProgress?: (p: number) => void): Promise<CloudinaryUploadResult> {
    return this.uploadFile(file, {
      folder: 'manshi-setu/expense-receipts',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      maxSizeBytes: 10 * 1024 * 1024,
      onProgress,
    });
  }

  /**
   * Helper to upload task attachment
   */
  async uploadTaskAttachment(file: File, onProgress?: (p: number) => void): Promise<CloudinaryUploadResult> {
    return this.uploadFile(file, {
      folder: 'manshi-setu/task-attachments',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      maxSizeBytes: 15 * 1024 * 1024,
      onProgress,
    });
  }
}

export const cloudinaryService = new CloudinaryService();
