import React, { useState } from 'react';
import { Heart, MessageCircle, PlusCircle, Share2, Sparkles, CheckCircle } from 'lucide-react';
import { FeedPost, UserProfile } from '../types';

interface MomentsViewProps {
  posts: FeedPost[];
  currentUser: UserProfile;
  onLikePost: (postId: string) => void;
  onAddPost: (caption: string, imageUrl: string) => void;
}

export const MomentsView: React.FC<MomentsViewProps> = ({
  posts,
  currentUser: _currentUser,
  onLikePost,
  onAddPost,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !imageUrl.trim()) return;
    onAddPost(caption.trim(), imageUrl.trim());
    setCaption('');
    setImageUrl('');
    setShowModal(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Campus Moments <Sparkles className="w-5 h-5 text-pink-400" />
          </h2>
          <p className="text-xs text-slate-400">Photos & stories from campus life</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="py-2 px-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Moment</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center mb-3 text-slate-500">
            <Sparkles className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-200">No campus moments yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Be the first to share a photo and story with the campus community!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-pink-500/20"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white">{post.author.displayName}</h4>
                    {post.author.status === 'VERIFIED' && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    @{post.author.handle} • {post.createdAt}
                  </p>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="aspect-[4/3] w-full bg-slate-950 overflow-hidden">
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            {/* Actions & Caption */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onLikePost(post.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold group"
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform group-active:scale-125 ${
                        post.isLiked ? 'fill-pink-500 text-pink-500' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    />
                    <span className={post.isLiked ? 'text-pink-400' : 'text-slate-400'}>
                      {post.likesCount}
                    </span>
                  </button>

                  <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-200">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.commentsCount}</span>
                  </button>
                </div>

                <button className="text-slate-400 hover:text-slate-200">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-white mr-1.5">@{post.author.handle}</span>
                {post.caption}
              </p>
            </div>
          </article>
        ))}
        </div>
      )}

      {/* New Moment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Share a Campus Moment</h3>
            <p className="text-xs text-slate-400 mb-4">Post a photo and caption for the campus wall.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's happening on campus?"
                  required
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold"
                >
                  Post Moment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
