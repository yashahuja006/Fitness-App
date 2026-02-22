'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

interface ProgramReviewsProps {
  programId: string;
}

export function ProgramReviews({ programId }: Readonly<ProgramReviewsProps>) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState({ rating: 0, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const savedReviews = localStorage.getItem(`reviews_${programId}`);
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
  }, [programId]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleSubmitReview = () => {
    if (userReview.rating === 0 || !userReview.comment.trim()) return;

    const newReview: Review = {
      id: `review_${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      rating: userReview.rating,
      comment: userReview.comment,
      date: new Date(),
      helpful: 0,
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${programId}`, JSON.stringify(updatedReviews));
    
    setUserReview({ rating: 0, comment: '' });
    setShowReviewForm(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reviews & Ratings
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-2xl ${
                    star <= averageRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowReviewForm(!showReviewForm)}
        >
          Write Review
        </Button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserReview({ ...userReview, rating: star })}
                  className="text-3xl hover:scale-110 transition-transform"
                >
                  <span
                    className={
                      star <= userReview.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Review
            </label>
            <textarea
              value={userReview.comment}
              onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
              placeholder="Share your experience with this program..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="primary" onClick={handleSubmitReview}>
              Submit Review
            </Button>
            <Button variant="secondary" onClick={() => setShowReviewForm(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {review.userName}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(review.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">{review.comment}</p>
            <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              👍 Helpful ({review.helpful})
            </button>
          </div>
        ))}

        {reviews.length === 0 && !showReviewForm && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No reviews yet. Be the first to review this program!
          </div>
        )}
      </div>
    </Card>
  );
}
