import { ReviewData } from '../types';

const STORAGE_KEY = 'travel_reviews';

export const getSavedReviews = (): ReviewData[] => {
  try {
    const savedReviews = localStorage.getItem(STORAGE_KEY);
    return savedReviews ? JSON.parse(savedReviews) : [];
  } catch (error) {
    console.error('Error getting saved reviews:', error);
    return [];
  }
};

export const saveReview = (review: ReviewData): void => {
  try {
    const savedReviews = getSavedReviews();
    const updatedReviews = [review, ...savedReviews];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
  } catch (error) {
    console.error('Error saving review:', error);
  }
};

export const deleteReview = (reviewId: string): void => {
  try {
    const savedReviews = getSavedReviews();
    const updatedReviews = savedReviews.filter(review => review.id !== reviewId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
  } catch (error) {
    console.error('Error deleting review:', error);
  }
};