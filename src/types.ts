export interface User {
  id: number;
  uploadedImage?: string;
  votes: string[];
}

export interface Image {
  id: string;
  url: string;
  uploaderId: number;
  votes: number;
  uploadDate: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  image?: Image;
}

export interface VoteResponse {
  success: boolean;
  message?: string;
}

export interface GalleryResponse {
  success: boolean;
  images: Image[];
}
