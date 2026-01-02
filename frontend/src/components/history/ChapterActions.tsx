// src/components/history/ChapterActions.tsx
import React from 'react';
import Button from '../ui/Button';
import { HeartIcon, ChatBubbleOvalLeftEllipsisIcon, ShareIcon } from './../icons/GenericIcons';
import { HistoryChapter } from '../../types';

interface ChapterActionsProps {
  chapter: HistoryChapter;
  isAuthenticated: boolean;
  tempLikes: Record<string, number>;
  tempIsLiked: Record<string, boolean>;
  onLike: (chapterId: string) => void;
  onComment: () => void;
  onShare: () => void;
}

const ChapterActions: React.FC<ChapterActionsProps> = ({
  chapter,
  isAuthenticated,
  tempLikes,
  tempIsLiked,
  onLike,
  onComment,
  onShare
}) => {
  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        onClick={() => onLike(chapter.id)}
        aria-label="Like"
        title="Like"
      >
        <HeartIcon
          title="Like"
          className="w-5 h-5 mr-1.5"
          isFilled={tempIsLiked[chapter.id]}
        />
        {tempLikes[chapter.id] ?? chapter.likes ?? 0}
        <span className="ml-1 hidden sm:inline">Like</span>
      </Button>

      <Button
        variant="ghost"
        onClick={onComment}
        aria-label="Comment"
        title="Comment"
      >
        <ChatBubbleOvalLeftEllipsisIcon
          title="Comment"
          className="w-5 h-5 mr-1.5"
        />
        {chapter.comments.length}
        <span className="ml-1 hidden sm:inline">Comment</span>
      </Button>

      <Button
        variant="ghost"
        onClick={onShare}
        aria-label="Share"
        title="Share"
      >
        <ShareIcon
          title="Share"
          className="w-5 h-5 mr-1.5"
        />
        <span className="hidden sm:inline">Share</span>
      </Button>
    </div>
  );
};

export default ChapterActions;
