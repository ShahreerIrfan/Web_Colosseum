import api from '@/apis/axios';

export interface UploadResponse {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
  folder: string;
}

export interface UploadOptions {
  section: string;
  slug?: string;
  subSection?: string;
  onProgress?: (percent: number) => void;
}

export const uploadApi = {
  /**
   * Uploads a file to Cloudinary through the ColosseumBackend stream endpoint.
   */
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const parts = [options.section, options.slug, options.subSection].filter(Boolean);
    const path = `/uploads/${parts.join('/')}`;

    const response = await api.post<{
      success: boolean;
      data?: UploadResponse;
      payload?: UploadResponse;
    }>(path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && options.onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(percent);
        }
      },
    });

    const result = response.data.data || response.data.payload;
    if (!result) {
      throw new Error('Upload succeeded but no asset payload was returned from server.');
    }
    return result;
  },

  /**
   * Deletes an uploaded asset by its Cloudinary public ID.
   */
  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
    await api.delete('/uploads', {
      data: { publicId, resourceType },
    });
  },
};

export default uploadApi;
