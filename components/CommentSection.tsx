import React, { useState, useEffect } from 'react';
import { DbService, Review } from '../services/db';

const CommentSection: React.FC = () => {
  const [comments, setComments] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await DbService.getReviews();
        setComments(data);
      } catch (e) {
        console.error("Failed to load reviews:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || !userName || isSubmitting) return;
    
    setIsSubmitting(true);
    const reviewData: Omit<Review, 'id'> = {
      name: userName,
      rating,
      text: newComment,
      date: "Just now",
      createdAt: Date.now()
    };
    
    try {
      await DbService.saveReview(reviewData);
      // Refresh list
      const updatedData = await DbService.getReviews();
      setComments(updatedData);
      
      // Reset form
      setNewComment("");
      setUserName("");
      setRating(5);
    } catch (err) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Farmer Community Feedback</h2>
          <p className="text-slate-500">Share your experience with the Agricare platform.</p>
        </div>

        {/* Form Styled to Match User Screenshot */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10 mb-16">
          <h3 className="text-2xl font-bold mb-8 text-slate-900">Leave a Review</h3>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Your Name</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-[#3f3f3f] text-slate-200 border-none outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 font-medium" 
                  placeholder="e.g. Kamal Hossain"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Rating</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-slate-200'}`}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-3">Your Comments</label>
              <textarea 
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-[#3f3f3f] text-slate-200 border-none outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 font-medium resize-none"
                placeholder="How has Agricare helped your farm in Bangladesh?"
                required
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#049364] text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#037d55] transition-all shadow-xl shadow-emerald-900/10 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 px-2 mb-4">Latest Feedback</h3>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-slate-900 text-lg">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.date === "Just now" ? c.date : new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-1 text-yellow-400 text-sm">
                    {[...Array(c.rating)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                  </div>
                </div>
                <p className="text-slate-600 text-base leading-relaxed italic">"{c.text}"</p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400 font-medium">
              No reviews yet. Be the first to share your experience!
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CommentSection;