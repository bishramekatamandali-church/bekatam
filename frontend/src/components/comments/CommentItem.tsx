
import React, { useState, useRef, useEffect } from 'react';
import { Comment } from '../../types';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatTimestampADBS } from '../../dateConverter';
import { Link } from "react-router-dom";
import { PencilIcon, TrashIcon, EllipsisVerticalIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';

interface CommentItemProps {
  comment: Comment;
  itemType: 'event' | 'sermon' | 'blogPost' | 'historyChapter' | 'news' | 'prayerRequest';
  itemId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, itemType, itemId }) => {
    const { currentUser, isAdmin, isOwner } = useAuth();
    const { updateComment, deleteComment } = useContent();
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(comment.text);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canEdit = currentUser && currentUser.id === comment.userId;
    const canDelete = currentUser && (currentUser.id === comment.userId || isAdmin || isOwner);
    const canManage = canEdit || canDelete;
    const menuRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdate = async () => {
        if (editedText.trim() === '' || editedText === comment.text) {
            setIsEditing(false);
            return;
        };
        setIsSubmitting(true);
        const success = await updateComment(comment.id, editedText, itemType, itemId);
        setIsSubmitting(false);
        if (success) {
            setIsEditing(false);
        } else {
            alert('Failed to update comment.');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            await deleteComment(comment.id, itemType, itemId);
            // The component will unmount as the parent's state updates, no need for more logic here.
        }
    };

    return (
        <div className="bg-white p-3 rounded-lg shadow-sm flex items-start space-x-3">
            <Link to={`/profile/${comment.userId}`} className="flex-shrink-0">
                {comment.userProfileImageUrl ? (
                    <img src={comment.userProfileImageUrl} alt={comment.userName} className="w-8 h-8 rounded-full object-cover"/>
                ) : (
                    <UserCircleIcon className="w-8 h-8 text-slate-400"/>
                )}
            </Link>
            <div className="flex-grow">
                <div className="flex items-start justify-between">
                    <div className="flex-grow">
                        <div className="flex items-center mb-1 flex-wrap">
                            <Link to={`/profile/${comment.userId}`} className="font-semibold text-slate-800 text-sm hover:underline">{comment.userName}</Link>
                            <p className="text-xs text-slate-400 mx-2">&bull;</p>
                            <p className="text-xs text-slate-400">{formatTimestampADBS(comment.timestamp)}</p>
                            {comment.editedAt && <p className="text-xs text-slate-400 ml-2 italic">(edited)</p>}
                        </div>
                        {!isEditing ? (
                            <p className="text-slate-700 text-sm whitespace-pre-line">{comment.text}</p>
                        ) : (
                            <div className="w-full mt-2">
                                <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="w-full text-sm p-2 border border-slate-300 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500"
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                                <div className="flex justify-end space-x-2 mt-2">
                                    <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedText(comment.text);}} disabled={isSubmitting}>Cancel</Button>
                                    <Button size="sm" variant="primary" onClick={handleUpdate} disabled={isSubmitting || editedText.trim() === ''}>
                                        {isSubmitting ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    {canManage && !isEditing && (
                        <div className="relative ml-2" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(p => !p)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-1 w-28 bg-white rounded-md shadow-lg border z-10">
                                    {canEdit && (
                                        <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                                            <PencilIcon className="w-3.5 h-3.5 mr-2" /> Edit
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button onClick={() => { handleDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                                            <TrashIcon className="w-3.5 h-3.5 mr-2" /> Delete
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
