import { useState } from "react";

interface InteractionHandlerConfig {
  currentUser?: any;
  isAuthenticated?: boolean;
  onRequireAuth?: () => void;
  onCommentSuccess?: () => void;
}

export default function useInteractionHandlers(config?: InteractionHandlerConfig) {
  const {
    currentUser,
    isAuthenticated,
    onRequireAuth,
    onCommentSuccess,
  } = config || {};

  const [tempLikes, setTempLikes] = useState(0);
  const [tempIsLiked, setTempIsLiked] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = (chapterId?: string | number) => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
  
    // You can track likes per chapter later if needed
    setTempIsLiked((prev) => !prev);
    setTempLikes((prev) => (tempIsLiked ? prev - 1 : prev + 1));
  };
  

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }

    setIsSubmittingComment(true);

    try {
      // Simulate saving
      await new Promise((res) => setTimeout(res, 700));

      onCommentSuccess?.();
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return {
    tempLikes,
    tempIsLiked,
    handleLike,
    handleSubmitComment,
    isSubmittingComment,
  };
}
