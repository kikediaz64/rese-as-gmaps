export interface ReviewData {
  id?: string;
  locationName: string;
  reviewTitle: string;
  reviewContent: string;
  images?: { data: string; mimeType: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
