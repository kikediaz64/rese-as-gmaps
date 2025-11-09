import React, { useState, useEffect } from 'react';
import { getSavedReviews, deleteReview } from '../services/storageService';
import { ReviewData } from '../types';
import { TrashIcon } from './icons/TrashIcon';

const SavedReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);

  useEffect(() => {
    setReviews(getSavedReviews());
  }, []);

  const handleDelete = (reviewId: string) => {
    deleteReview(reviewId);
    const updatedReviews = reviews.filter(r => r.id !== reviewId);
    setReviews(updatedReviews);
    if (selectedReview?.id === reviewId) {
      setSelectedReview(null);
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-800/50 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-gray-300">No Saved Reviews Yet</h2>
        <p className="text-gray-400 mt-2">Go to the 'Review Generator' to create and save your first travel review!</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-gray-800/50 rounded-xl shadow-2xl border border-gray-700 p-4 h-fit backdrop-blur-sm">
        <h2 className="text-lg font-bold text-white mb-3">Your Saved Reviews</h2>
        <ul className="space-y-2">
          {reviews.map(review => (
            <li key={review.id}>
              <button
                onClick={() => setSelectedReview(review)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${selectedReview?.id === review.id ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                <p className="font-semibold truncate">{review.reviewTitle}</p>
                <p className="text-xs opacity-80 truncate">{review.locationName}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-2">
        {selectedReview ? (
          <div className="p-6 bg-gray-800/50 rounded-xl shadow-2xl border border-gray-700 animate-fade-in backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400">{selectedReview.reviewTitle}</h2>
                <h3 className="text-lg font-semibold text-gray-300 mt-1 mb-4">{selectedReview.locationName}</h3>
              </div>
              <button
                onClick={() => handleDelete(selectedReview.id!)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded-full transition-colors duration-200 flex-shrink-0"
                aria-label="Delete review"
              >
                <TrashIcon />
              </button>
            </div>
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">{selectedReview.reviewContent}</p>
            {selectedReview.images && selectedReview.images.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Photo Gallery</h4>
                <div className="flex flex-wrap gap-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700">
                  {selectedReview.images.map((image, index) => (
                    <img
                      key={index}
                      src={`data:${image.mimeType};base64,${image.data}`}
                      alt={`review gallery ${index}`}
                      className="w-24 h-24 rounded-md object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center p-8 bg-gray-800/50 rounded-xl shadow-2xl border border-gray-700 backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-300">Select a Review</h2>
              <p className="text-gray-400 mt-2">Choose a review from the list on the left to see its details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedReviews;