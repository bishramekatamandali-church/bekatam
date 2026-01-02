/*
import React, { useMemo, useState, useEffect } from 'react';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { HistoryChapter, Comment as CommentType } from '../types';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import AuthModal from '../components/auth/AuthModal';
import CommentModal from '../components/ui/CommentModal';
import ShareModal from '../components/ui/ShareModal';
import { formatTimestampADBS, formatDateADBS } from '../dateConverter';
import { Link, useLocation } from 'https://esm.sh/react-router-dom@6';
import { generateChapterPdf } from '../components/history/PrintableChapterPDF'; 
import CommentItem from '../components/comments/CommentItem';

// Icons
const SparklesIconSolid: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M5 2.5A2.5 2.5 0 017.5 0h5A2.5 2.5 0 0115 2.5V5h2.5A2.5 2.5 0 0120 7.5v5a2.5 2.5 0 01-2.5 2.5H15v2.5A2.5 2.5 0 0112.5 20h-5A2.5 2.5 0 015 17.5V15H2.5A2.5 2.5 0 010 12.5v-5A2.5 2.5 0 012.5 5H5V2.5zM7.5 7.5A.5.5 0 007 8v4a.5.5 0 00.5.5h5a.5.5 0 00.5-.5V8a.5.5 0 00-.5-.5h-5z" clipRule="evenodd" /></svg>
);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.25 4.533A9.709 9.709 0 0 0 3 12a9.709 9.709 0 0 0 8.25 7.467c.953.093 1.69.837 1.69 1.779V21.75a.75.75 0 0 0 1.5 0V21.25c0-.942.737-1.686 1.69-1.779A9.709 9.709 0 0 0 21 12a9.709 9.709 0 0 0-8.25-7.467V3.75a.75.75 0 0 0-1.5 0v.783Z" /><path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /></svg>
);
const UserCircleIconSmall: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.75a.75.75 0 00-1.5 0V7.5H9.75a.75.75 0 000 1.5H11V10.5a.75.75 0 001.5 0V9h.75a.75.75 0 000-1.5H12.5V6.25z" clipRule="evenodd" />
  </svg>
);
const HeartIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={isFilled ? "currentColor" : "none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} ${isFilled ? 'text-red-500' : ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
const ChatBubbleOvalLeftEllipsisIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25a9.765 9.765 0 01-1.935-.274A7.707 7.707 0 0012 15.75a7.71 7.71 0 00-3.935 1.085A9.754 9.754 0 013 12c0-4.556-3.86-8.25 8.625-8.25S21 7.444 21 12z" /></svg>
);
const ShareIconUI: React.FC<{ className?: string }> = ({ className }) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.383.05.571.078m-1.571 2.032c.195.025.383.05.571.078m13.48 0a2.25 2.25 0 01-.621 1.628l-3.029 3.028a2.25 2.25 0 01-3.182 0l-3.029-3.028a2.25 2.25 0 01-.621-1.628m13.48 0L19.25 12l-1.521-.078m13.48 0c0 2.042-.832 3.901-2.186 5.256L16.5 21.75m1.217-9.843c-.195-.025-.383-.05-.571-.078m-1.571-2.032c-.195-.025-.383-.05-.571-.078m-1.412 5.690c.195.025.383.05.571.078" /></svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
);


const ChurchHistoryPage: React.FC = () => {
  const { historyChapters, loadingContent, homeSlides, addCommentToItem, logContentActivity, getContentById } = useContent();
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeChapterForModal, setActiveChapterForModal] = useState<HistoryChapter | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [tempLikes, setTempLikes] = useState<Record<string, number>>({});
  const [tempIsLiked, setTempIsLiked] = useState<Record<string, boolean>>({});

  const publishedChapters = useMemo(() => 
    historyChapters
      .filter(ch => ch.status === 'published')
      .sort((a, b) => b.chapterNumber - a.chapterNumber),
  [historyChapters]);
  
  useEffect(() => {
    if (location.hash && !loadingContent) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => { // Timeout to allow layout shifts to settle
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash, loadingContent]);

  const handleLike = (chapterId: string) => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    
    const newLikedState = !tempIsLiked[chapterId];
    setTempIsLiked(prev => ({...prev, [chapterId]: newLikedState}));
    setTempLikes(prev => ({...prev, [chapterId]: (prev[chapterId] || publishedChapters.find(c=>c.id===chapterId)?.likes || 0) + (newLikedState ? 1 : -1)}));
    
    const chapter = publishedChapters.find(c => c.id === chapterId);
    if(chapter) {
        logContentActivity(
            `${currentUser?.fullName || 'User'} ${newLikedState ? 'liked' : 'unliked'} history chapter: "${chapter.title}"`,
            'content_update', 'historyChapter', chapter.id
        );
        alert(`Like action simulated for "${chapter.title}"!`);
    }
  };

  const handleOpenCommentModal = (chapter: HistoryChapter) => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setActiveChapterForModal(chapter);
    setIsCommentModalOpen(true);
  };
  
  const handleOpenShareModal = (chapter: HistoryChapter) => {
    setActiveChapterForModal(chapter);
    setIsShareModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!activeChapterForModal || !currentUser) return;
    setIsSubmittingComment(true);
    const result = await addCommentToItem(activeChapterForModal.id, 'historyChapter', commentText);
    setIsSubmittingComment(false);
    if (result) {
      setIsCommentModalOpen(false);
      setActiveChapterForModal(null);
    } else {
      alert("Failed to submit comment.");
    }
  };
  
  const handleDownloadPdf = async (chapter: HistoryChapter) => {
    alert("PDF generation started. This may take a moment...");
    await generateChapterPdf(chapter, 'a5');
  };

  if (loadingContent) {
    return <div className="container mx-auto px-4 py-12 text-center text-slate-600 dark:text-slate-300">Loading Church History...</div>;
  }

  return (
    <div>
      <div className="container mx-auto px-4 pb-12">
        {publishedChapters.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-10">
                The history of our church is currently being written. Please check back soon for published chapters.
            </p>
        ) : (
          <div className="space-y-12">
            {publishedChapters.map(chapter => (
              <Card key={chapter.id} id={chapter.id} className="scroll-mt-24 dark:bg-slate-800">
                <CardHeader className="dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Chapter {chapter.chapterNumber}</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{chapter.title}</h2>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(chapter)} className="flex items-center dark:text-purple-300 dark:border-purple-500 dark:hover:bg-purple-700 dark:hover:text-white">
                            <DownloadIcon className="w-4 h-4 mr-2" /> PDF
                         </Button>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center flex-wrap gap-x-3 gap-y-1">
                        {chapter.authorName && (
                            <span className="flex items-center"><UserCircleIconSmall className="w-3.5 h-3.5 mr-1"/> By {chapter.authorName}</span>
                        )}
                        {chapter.lastPublishedAt && (
                             <span>Published: {formatDateADBS(chapter.lastPublishedAt)}</span>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                  {chapter.imageUrl && (
                    <img src={chapter.imageUrl} alt={chapter.title} className="w-full h-auto max-h-[450px] object-cover rounded-lg shadow-md mb-6" />
                  )}
                  <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line text-base leading-relaxed">
                    {chapter.content}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => handleLike(chapter.id)} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400" aria-pressed={tempIsLiked[chapter.id]}>
                        <HeartIcon className="w-5 h-5 mr-1.5" isFilled={tempIsLiked[chapter.id]} /> 
                        {tempLikes[chapter.id] !== undefined ? tempLikes[chapter.id] : (chapter.likes || 0)} <span className="ml-1 hidden sm:inline">Like</span>
                    </Button>
                    <Button variant="ghost" onClick={() => handleOpenCommentModal(chapter)} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mr-1.5" /> 
                        {chapter.comments.length} <span className="ml-1 hidden sm:inline">Comment</span>
                    </Button>
                    <Button variant="ghost" onClick={() => handleOpenShareModal(chapter)} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400">
                        <ShareIconUI className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>
                  <div className="w-full sm:w-auto">
                    <Button onClick={() => handleOpenCommentModal(chapter)} variant="primary" size="sm" className="w-full">Leave a Comment</Button>
                  </div>
                </CardFooter>
                 {chapter.comments && chapter.comments.length > 0 && (
                    <div className="p-4 sm:p-6 border-t dark:border-slate-700">
                        <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">Comments ({chapter.comments.length})</h4>
                        <div className="space-y-4">
                            {chapter.comments.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(comment => (
                                <CommentItem key={comment.id} comment={comment} itemId={chapter.id} itemType="historyChapter" />
                            ))}
                        </div>
                    </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

       <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        {activeChapterForModal && (
            <>
                <ShareModal 
                    isOpen={isShareModalOpen} 
                    onClose={() => {setIsShareModalOpen(false); setActiveChapterForModal(null);}} 
                    title={`Share "${activeChapterForModal.title}"`}
                    url={`/church-history#${activeChapterForModal.id}`}
                    eventTitle={activeChapterForModal.title} 
                />
                <CommentModal
                    isOpen={isCommentModalOpen}
                    onClose={() => {setIsCommentModalOpen(false); setActiveChapterForModal(null);}}
                    eventTitle={activeChapterForModal.title} 
                    onSubmitComment={handleSubmitComment}
                    isSubmitting={isSubmittingComment}
                />
            </>
        )}
    </div>
  );
};

export default ChurchHistoryPage;
*/




// src/pages/ChurchHistoryPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { HistoryChapter } from '../types';
import Card from '../components/ui/Card';
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
            {publishedChapters.map(chapter => (
              <Card key={chapter.id} id={chapter.id} className="scroll-mt-24 dark:bg-slate-800">
                <Card.Header>
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
                </Card.Header>
                <Card.Content>
                  {chapter.imageUrl && (
                    <img src={chapter.imageUrl} alt={chapter.title} className="w-full max-h-[450px] object-cover rounded-lg shadow mb-6" />
                  )}
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-line text-base leading-relaxed text-slate-700 dark:text-slate-300">
                    {chapter.content}
                  </div>
                </Card.Content>
                <Card.Footer>
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
                    commentsCount={chapter.comments.length}
                  />
                </Card.Footer>
                {chapter.comments.length > 0 && (
                  <div className="p-4 sm:p-6 border-t dark:border-slate-700">
                    <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">
                      Comments ({chapter.comments.length})
                    </h4>
                    <div className="space-y-4">
                      {chapter.comments.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(comment => (
                        <CommentItem key={comment.id} comment={comment} itemId={chapter.id} itemType="historyChapter" />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
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
