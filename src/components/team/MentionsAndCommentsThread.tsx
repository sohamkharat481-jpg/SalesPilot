import React, { useState } from 'react';
import { 
  MessageSquare, 
  AtSign, 
  Pin, 
  Send, 
  Lock, 
  Globe, 
  User, 
  Check, 
  Clock, 
  Sparkles, 
  Trash2 
} from 'lucide-react';
import { CRMComment, WorkspaceMember } from '../../types/team-collaboration';

interface MentionsAndCommentsThreadProps {
  user: any;
  entityType: 'LEAD' | 'DEAL' | 'CAMPAIGN' | 'CALL' | 'WORKFLOW';
  entityId: string;
  comments: CRMComment[];
  teamMembers: WorkspaceMember[];
  onAddComment: (commentData: {
    entityType: 'LEAD' | 'DEAL' | 'CAMPAIGN' | 'CALL' | 'WORKFLOW';
    entityId: string;
    text: string;
    mentions: { userId: string; name: string; email: string }[];
    isInternal: boolean;
  }) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  loading: boolean;
}

export const MentionsAndCommentsThread: React.FC<MentionsAndCommentsThreadProps> = ({
  user,
  entityType,
  entityId,
  comments,
  teamMembers,
  onAddComment,
  onDeleteComment,
  loading
}) => {
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // Handle @mention typing detection
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    const lastAtPos = val.lastIndexOf('@');
    if (lastAtPos !== -1 && lastAtPos >= val.length - 15) {
      const query = val.slice(lastAtPos + 1).toLowerCase();
      setMentionFilter(query);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const insertMention = (member: WorkspaceMember) => {
    const lastAtPos = commentText.lastIndexOf('@');
    const before = commentText.substring(0, lastAtPos);
    const updated = `${before}@${member.fullName} `;
    setCommentText(updated);
    setShowMentionSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Detect mentioned members
    const mentions: { userId: string; name: string; email: string }[] = [];
    teamMembers.forEach(m => {
      if (commentText.includes(`@${m.fullName}`)) {
        mentions.push({ userId: m.userId || m.id, name: m.fullName, email: m.email });
      }
    });

    onAddComment({
      entityType,
      entityId,
      text: commentText,
      mentions,
      isInternal: isInternalNote
    });

    setCommentText('');
    setShowMentionSuggestions(false);
  };

  const filteredComments = comments.filter(c => c.entityId === entityId || !entityId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Internal Notes & @Mentions Feed
          </h4>
        </div>
        <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
          {filteredComments.length} Notes Recorded
        </span>
      </div>

      {/* Comment Input Box */}
      <form onSubmit={handleSubmit} className="space-y-3 relative">
        <div className="relative">
          <textarea
            value={commentText}
            onChange={handleTextChange}
            placeholder="Type internal note or mention teammates using @name..."
            className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          />

          {/* Mention Autocomplete Dropdown */}
          {showMentionSuggestions && (
            <div className="absolute left-3 bottom-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-30 max-h-48 overflow-y-auto w-64 space-y-1">
              <div className="text-[9px] font-mono text-slate-400 px-2 py-1 uppercase font-bold">
                Mention Teammate
              </div>
              {teamMembers
                .filter(m => m.fullName.toLowerCase().includes(mentionFilter))
                .map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => insertMention(member)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2 transition cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[9px] flex items-center justify-center">
                      {member.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{member.fullName}</span>
                    <span className="text-[10px] font-mono text-slate-400 ml-auto">{member.role}</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsInternalNote(!isInternalNote)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isInternalNote 
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isInternalNote ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            <span>{isInternalNote ? 'Internal Team Note Only' : 'Shared Client Note'}</span>
          </button>

          <button
            type="submit"
            disabled={loading || !commentText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Post Note
          </button>
        </div>
      </form>

      {/* Comments List Feed */}
      <div className="space-y-4 pt-2">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 font-mono">
            No notes or @mentions yet. Post an internal update above.
          </div>
        ) : (
          filteredComments.map(comment => (
            <div 
              key={comment.id}
              className={`p-4 rounded-2xl border transition space-y-2 ${
                comment.isInternal
                  ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/30'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {comment.authorName ? comment.authorName.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {comment.authorName}
                    </span>
                    <span className="ml-2 text-[10px] font-mono text-slate-400">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {comment.isInternal && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-mono font-bold rounded-md flex items-center gap-1">
                      <Lock className="w-3 h-3" /> INTERNAL
                    </span>
                  )}
                  {onDeleteComment && (
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pl-9">
                {comment.text}
              </p>

              {comment.mentions && comment.mentions.length > 0 && (
                <div className="pl-9 flex items-center gap-2 pt-1">
                  <AtSign className="w-3 h-3 text-blue-500" />
                  {comment.mentions.map(m => (
                    <span key={m.userId} className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-md">
                      @{m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
