// src/pages/ChurchHistoryPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { HistoryChapter } from '../types';
import Card, { CardContent, CardFooter, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import AuthModal from '../components/auth/AuthModal';
import ShareModal from '../components/ui/ShareModal';
import { formatDateADBS } from '../dateConverter';
import { useLocation } from 'react-router-dom';
import { generateChapterPdf } from '../components/history/PrintableChapterPDF'; 
import CommentItem from '../components/comments/CommentItem';
import LoadingSpinner from './../components/ui/LoadingSpinner';
import ChapterActions from '../components/history/ChapterActions';
import { getMediaKindFromUrl } from '../utils/media';
import FullscreenImageModal from '../components/ui/FullscreenImageModal';

const ChurchHistoryPage: React.FC = () => {
  const { historyChapters, loadingContent, addCommentToItem, toggleLikeOnItem, logContentActivity } = useContent();
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeChapterForModal, setActiveChapterForModal] = useState<HistoryChapter | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
  const [commentSuccessMessage, setCommentSuccessMessage] = useState<string | null>(null);
  const [likedChapters, setLikedChapters] = useState<Record<string, boolean>>({});
  const [openCommentForms, setOpenCommentForms] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null);

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

  useEffect(() => {
    const nextLiked: Record<string, boolean> = {};
    historyChapters.forEach((chapter) => {
      if (chapter.likedByMe !== undefined) {
        nextLiked[chapter.id] = Boolean(chapter.likedByMe);
      }
    });
    setLikedChapters((prev) => ({ ...prev, ...nextLiked }));
  }, [historyChapters]);

  const handleDownloadPdf = async (chapter: HistoryChapter) => {
    setIsGeneratingPdf(chapter.id);
    await generateChapterPdf(chapter, 'a5');
    setIsGeneratingPdf(null);
  };

  const handleLike = async (chapter: HistoryChapter) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const isLiked = likedChapters[chapter.id] ?? false;
    const updated = await toggleLikeOnItem('historyChapter', chapter.id, isLiked);
    if (updated?.likes !== undefined) {
      setLikedChapters((prev) => ({ ...prev, [chapter.id]: !isLiked }));
      logContentActivity(
        `${currentUser?.fullName || 'User'} ${!isLiked ? 'liked' : 'unliked'} history chapter: "${chapter.title}"`,
        'content_update',
        'historyChapter',
        chapter.id
      );
    }
  };

  const toggleCommentForm = (chapterId: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setOpenCommentForms((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleSubmitComment = async (chapter: HistoryChapter) => {
    if (!currentUser) return;
    const draft = commentDrafts[chapter.id]?.trim() ?? '';
    if (!draft) {
      setCommentErrors((prev) => ({ ...prev, [chapter.id]: 'Please enter a comment before submitting.' }));
      return;
    }
    setCommentErrors((prev) => ({ ...prev, [chapter.id]: '' }));
    setIsSubmittingComment((prev) => ({ ...prev, [chapter.id]: true }));
    const newComment = await addCommentToItem(chapter.id, 'historyChapter', draft);
    setIsSubmittingComment((prev) => ({ ...prev, [chapter.id]: false }));
    if (newComment) {
      setCommentDrafts((prev) => ({ ...prev, [chapter.id]: '' }));
      setOpenCommentForms((prev) => ({ ...prev, [chapter.id]: false }));
      setCommentSuccessMessage("Comment submitted successfully!");
      setTimeout(() => setCommentSuccessMessage(null), 3000);
    } else {
      alert("There was an issue submitting your comment. Please try again.");
    }
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
                        <button
                          type="button"
                          onClick={() => setFullscreenImage({ url: chapter.imageUrl, title: chapter.title })}
                          className="mb-6 w-full focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                          aria-label={`View ${chapter.title} image full screen`}
                        >
                          <img
                            src={chapter.imageUrl}
                            alt={chapter.title}
                            className="w-full max-h-[450px] object-cover rounded-lg shadow"
                          />
                        </button>
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
                    onLike={() => handleLike(chapter)}
                    onComment={() => toggleCommentForm(chapter.id)}
                    onShare={() => {
                      setActiveChapterForModal(chapter);
                      setIsShareModalOpen(true);
                    }}
                    likes={chapter.likes ?? 0}
                    isLiked={likedChapters[chapter.id]}
                    commentsCount={comments.length}
                  />
                </CardFooter>
                {openCommentForms[chapter.id] && (
                  <div className="border-t border-slate-200 bg-slate-50 px-4 pb-4 pt-3 dark:border-slate-700 dark:bg-slate-900">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmitComment(chapter);
                      }}
                      className="space-y-3"
                    >
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor={`chapter-comment-${chapter.id}`}>
                        Add a comment
                      </label>
                      <textarea
                        id={`chapter-comment-${chapter.id}`}
                        value={commentDrafts[chapter.id] ?? ''}
                        onChange={(event) => {
                          setCommentDrafts((prev) => ({ ...prev, [chapter.id]: event.target.value }));
                          if (commentErrors[chapter.id]) {
                            setCommentErrors((prev) => ({ ...prev, [chapter.id]: '' }));
                          }
                        }}
                        rows={3}
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="Share your thoughts on this chapter."
                      />
                      {commentErrors[chapter.id] && (
                        <p className="text-xs text-red-500">{commentErrors[chapter.id]}</p>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenCommentForms((prev) => ({ ...prev, [chapter.id]: false }))}
                          disabled={isSubmittingComment[chapter.id]}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={isSubmittingComment[chapter.id]}
                        >
                          {isSubmittingComment[chapter.id] ? 'Submitting...' : 'Submit Comment'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
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
      {fullscreenImage && (
        <FullscreenImageModal
          isOpen={Boolean(fullscreenImage)}
          onClose={() => setFullscreenImage(null)}
          imageUrl={fullscreenImage.url}
          alt={fullscreenImage.title}
        />
      )}
      {activeChapterForModal && (
        <>
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => { setIsShareModalOpen(false); setActiveChapterForModal(null); }}
            title={`Share "${activeChapterForModal.title}"`}
            url={`/church-history#${activeChapterForModal.id}`}
            eventTitle={activeChapterForModal.title}
          />
        </>
      )}
    </div>
  );
};

export default ChurchHistoryPage;
