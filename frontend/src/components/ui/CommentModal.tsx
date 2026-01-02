
import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  onSubmitComment: (commentText: string) => void; // This will be async in parent
  isSubmitting?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
  isOpen, 
  onClose, 
  eventTitle, 
  onSubmitComment,
  isSubmitting = false 
}) => {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      alert("Comment cannot be empty.");
      return;
    }
    // Parent component (EventCard or SingleEventPage) will handle the async submission
    // and potentially set its own isSubmitting state if needed for more complex UI.
    // This component's isSubmitting prop is for disabling its own buttons.
    await onSubmitComment(commentText); 
    // Parent should handle closing the modal and resetting text, or this can do it too.
    // For simplicity, we'll assume parent handles closing, but we reset text here.
    setCommentText(''); 
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Leave a Comment on "${eventTitle}"`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="commentText" className="block text-sm font-medium text-slate-700 sr-only">
            Your Comment
          </label>
          <textarea
            id="commentText"
            name="commentText"
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="mt-1 block w-full p-2.5 border border-slate-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            placeholder="Write your comment here..."
            required
            aria-label="Your comment"
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !commentText.trim()}>
            {isSubmitting ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CommentModal;
