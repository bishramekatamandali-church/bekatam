// src/pages/ChurchHistoryPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { HistoryChapter } from '../types';
import Card, { CardContent, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import AuthModal from '../components/auth/AuthModal';
import CommentModal from '../components/ui/CommentModal';
import ShareModal from '../components/ui/ShareModal';
import { formatDateADBS } from '../dateConverter';
import { useLocation } from 'react-router-dom';
import { generateChapterPdf } from '../components/history/PrintableChapterPDF'; 
import CommentItem from '../components/comments/CommentItem';
import LoadingSpinner from './../components/ui/LoadingSpinner';
import ChapterActions from '../components/history/ChapterActions';
import useInteractionHandlers from './../hooks/useInteractionHandlers';
import { getMediaKindFromUrl } from '../utils/media';

const ChurchHistoryPage: React.FC = () => {
  const { historyChapters, loadingContent } = useContent();
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeChapterForModal, setActiveChapterForModal] = useState<HistoryChapter | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
  const [commentSuccessMessage, setCommentSuccessMessage] = useState<string | null>(null);

  const {
    tempLikes,
    tempIsLiked,
    handleLike,
    handleSubmitComment,
    isSubmittingComment,
  } = useInteractionHandlers({
    currentUser,
    isAuthenticated,
    onRequireAuth: () => setIsAuthModalOpen(true),
    onCommentSuccess: () => {
      setIsCommentModalOpen(false);
      setActiveChapterForModal(null);
      setCommentSuccessMessage("Comment submitted successfully!");
      setTimeout(() => setCommentSuccessMessage(null), 3000);
    }
  });

  const publishedChapters = useMemo(() =>
    historyChapters.filter(ch => ch.status === 'published').sort((a, b) => b.chapterNumber - a.chapterNumber),
    [historyChapters]);

  useEffect(() => {
    if (location.hash && !loadingContent) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash, loadingContent]);

  const handleDownloadPdf = async (chapter: HistoryChapter) => {
    setIsGeneratingPdf(chapter.id);
    await generateChapterPdf(chapter, 'a5');
    setIsGeneratingPdf(null);
  };

  return (
    <div>
      <div className="container mx-auto px-4 pb-12">
        {loadingContent ? (
          <div className="text-center py-10"><LoadingSpinner /> Loading Church History...</div>
        ) : publishedChapters.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-10">
            The history of our church is currently being written. Please check back soon.
          </p>
        ) : (
          <div className="space-y-12">
            {publishedChapters.map(chapter => {
              const mediaKind = getMediaKindFromUrl(chapter.imageUrl);
              const comments = chapter.comments ?? [];
              return (
                <Card key={chapter.id} id={chapter.id} className="scroll-mt-24 dark:bg-slate-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Chapter {chapter.chapterNumber}</span>
                      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{chapter.title}</h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(chapter)}
                      disabled={isGeneratingPdf === chapter.id}
                    >
                      {isGeneratingPdf === chapter.id ? <LoadingSpinner small /> : <span className="mr-2" title="Download PDF">📥</span>} PDF
                    </Button>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex flex-wrap gap-3">
                    {chapter.authorName && (
                      <span className="flex items-center" title="Author">
                        👤 By {chapter.authorName}
                      </span>
                    )}
                    {chapter.lastPublishedAt && (
                      <span>Published: {formatDateADBS(chapter.lastPublishedAt)}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {chapter.imageUrl && (
                    <>
                      {mediaKind === 'image' && (
                        <img
                          src={chapter.imageUrl}
                          alt={chapter.title}
                          className="w-full max-h-[450px] object-cover rounded-lg shadow mb-6"
                        />
                      )}
                      {mediaKind === 'video' && (
                        <video
                          src={chapter.imageUrl}
                          controls
                          className="w-full max-h-[450px] rounded-lg shadow mb-6"
                        />
                      )}
                      {mediaKind === 'audio' && (
                        <audio src={chapter.imageUrl} controls className="w-full mb-6" />
                      )}
                      {mediaKind === 'other' && (
                        <a
                          href={chapter.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-sm text-purple-600 underline mb-6"
                        >
                          View uploaded file
                        </a>
                      )}
                    </>
                  )}
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-300">
                    {chapter.content}
                  </div>
                </CardContent>
                <CardFooter>
                  <ChapterActions
                    chapter={chapter}
                    isAuthenticated={isAuthenticated}
                    onLike={() => handleLike(chapter.id)}
                    onComment={() => {
                      if (!isAuthenticated) return setIsAuthModalOpen(true);
                      setActiveChapterForModal(chapter);
                      setIsCommentModalOpen(true);
                    }}
                    onShare={() => {
                      setActiveChapterForModal(chapter);
                      setIsShareModalOpen(true);
                    }}
                    likes={tempLikes[chapter.id] ?? chapter.likes ?? 0}
                    isLiked={tempIsLiked[chapter.id]}
                    commentsCount={comments.length}
                  />
                </CardFooter>
                {comments.length > 0 && (
                  <div className="p-4 sm:p-6 border-t dark:border-slate-700">
                    <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">
                      Comments ({comments.length})
                    </h4>
                    <div className="space-y-4">
                      {comments.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(comment => (
                        <CommentItem key={comment.id} comment={comment} itemId={chapter.id} itemType="historyChapter" />
                      ))}
                    </div>
                  </div>
                )}
                </Card>
              );
            })}
            {commentSuccessMessage && (
              <div className="text-green-600 dark:text-green-400 text-center mt-6">{commentSuccessMessage}</div>
            )}
          </div>
        )}
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {activeChapterForModal && (
        <>
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => { setIsShareModalOpen(false); setActiveChapterForModal(null); }}
            title={`Share "${activeChapterForModal.title}"`}
            url={`/church-history#${activeChapterForModal.id}`}
            eventTitle={activeChapterForModal.title}
          />
          <CommentModal
            isOpen={isCommentModalOpen}
            onClose={() => { setIsCommentModalOpen(false); setActiveChapterForModal(null); }}
            eventTitle={activeChapterForModal.title}
            onSubmitComment={handleSubmitComment.bind(null, activeChapterForModal.id)}
            isSubmitting={isSubmittingComment}
          />
        </>
      )}
    </div>
  );
};

export default ChurchHistoryPage;
