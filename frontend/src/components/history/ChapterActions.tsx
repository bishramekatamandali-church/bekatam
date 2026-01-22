// src/components/history/ChapterActions.tsx
import React from 'react';
import Button from '../ui/Button';
import { ChatBubbleLeftRightIcon, ArrowUpOnSquareIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

interface ChapterActionsProps {
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

const ChapterActions: React.FC<ChapterActionsProps> = ({
  likes,
  isLiked,
  commentsCount,
  onLike,
  onComment,
  onShare
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        onClick={onLike}
        aria-label={isLiked ? `Unlike chapter, ${likes} likes` : `Like chapter, ${likes} likes`}
        title="Like"
        aria-pressed={isLiked}
        className="flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600"
      >
        {isLiked ? <HandThumbUpIconSolid className="h-5 w-5 text-purple-600" /> : <HandThumbUpIcon className="h-5 w-5" />}
        <span className="text-sm font-medium">{likes}</span>
        <span className="text-sm font-medium hidden sm:inline">Like</span>
      </Button>

      <Button
        variant="ghost"
        onClick={onComment}
        aria-label={`Comment on chapter, ${commentsCount} comments`}
        title="Comment"
        className="flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600"
      >
      <ChatBubbleLeftRightIcon className="h-5 w-5" />
        <span className="text-sm font-medium">{commentsCount}</span>
        <span className="text-sm font-medium hidden sm:inline">Comment</span>        
     </Button>

      <Button
        variant="ghost"
        onClick={onShare}
        aria-label="Share chapter"
        title="Share"
        className="flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600"
      >
        <ArrowUpOnSquareIcon className="h-5 w-5" />
        <span className="text-sm font-medium hidden sm:inline">Share</span>
      </Button>
    </div>
  );
};

export default ChapterActions;
