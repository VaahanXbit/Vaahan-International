// src/pages/ArticleDetail.jsx
/*
================================================================================
File Name : ArticleDetail.jsx
Author : Tahseen Raza
Created Date : 2025-01-15
Description : Individual article detail page with full theme support
Company : Vaahan International
Copyright : (c) 2025 Vaahan International. All rights reserved.
================================================================================
*/

import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { getArticleBySlug, getAllArticles } from '../data/articlesData'
import { api } from '../services/api'
import AuthModal from '../components/AuthModal'

// Pulls the userId out of a JWT without needing a network call — the token
// payload is just base64, so this is safe to decode client-side (it's not
// being trusted for anything security-sensitive, only for UI state like
// "did I already upvote this?").
const decodeUserId = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.userId || null
  } catch {
    return null
  }
}

const ArticleDetail = () => {
  const { slug } = useParams()
  const { isDark } = useTheme()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedArticles, setRelatedArticles] = useState([])

  // Auth
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const currentUserId = useMemo(() => (token ? decodeUserId(token) : null), [token])
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Upvotes
  const [upvotes, setUpvotes] = useState(0)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoting, setUpvoting] = useState(false)

  // Comments
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true)
        
        // Get article by slug from API
        const articleData = await getArticleBySlug(slug)
        setArticle(articleData || null)
        
        if (articleData) {
          // Get related articles (same category, different slug)
          const allArticlesData = await getAllArticles()
          const related = allArticlesData
            .filter(a => a.category === articleData.category && a.slug !== slug)
            .slice(0, 3)
          setRelatedArticles(related)

          // Seed upvote state from the article payload
          setUpvotes(articleData.upvotes || 0)
          setHasUpvoted(
            !!currentUserId && (articleData.upvotedBy || []).includes(currentUserId)
          )
        }
      } catch (error) {
        console.error('❌ Error fetching article:', error)
        setArticle(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // Fetch comments once we know the article's real database id
  useEffect(() => {
    if (!article?._id) return

    const fetchComments = async () => {
      try {
        setCommentsLoading(true)
        const res = await api.getComments(article._id)
        if (res.success) setComments(res.comments)
      } catch (error) {
        console.error('❌ Error fetching comments:', error)
      } finally {
        setCommentsLoading(false)
      }
    }

    fetchComments()
  }, [article?._id])

  const requireAuth = () => {
    if (!token) {
      setIsAuthModalOpen(true)
      return false
    }
    return true
  }

  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false)
    // Pick up the token that AuthModal just saved to localStorage, if any
    setToken(localStorage.getItem('token'))
  }

  const handleUpvote = async () => {
    if (!requireAuth() || upvoting || !article?._id) return

    setUpvoting(true)
    const nextHasUpvoted = !hasUpvoted
    // Optimistic update
    setHasUpvoted(nextHasUpvoted)
    setUpvotes((prev) => prev + (nextHasUpvoted ? 1 : -1))

    try {
      const res = await api.upvoteArticle(article._id, token)
      if (res.success) {
        setUpvotes(res.upvotes)
        setHasUpvoted(res.hasUpvoted)
      } else {
        // Revert on failure
        setHasUpvoted(!nextHasUpvoted)
        setUpvotes((prev) => prev + (nextHasUpvoted ? -1 : 1))
      }
    } catch (error) {
      console.error('❌ Error upvoting article:', error)
      setHasUpvoted(!nextHasUpvoted)
      setUpvotes((prev) => prev + (nextHasUpvoted ? -1 : 1))
    } finally {
      setUpvoting(false)
    }
  }

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!requireAuth()) return
    if (!commentText.trim() || !article?._id) return

    setPostingComment(true)
    setCommentError('')
    try {
      const res = await api.addComment(article._id, commentText.trim(), token)
      if (res.success) {
        setComments((prev) => [res.comment, ...prev])
        setCommentText('')
      } else {
        setCommentError(res.message || 'Failed to post comment')
      }
    } catch (error) {
      console.error('❌ Error posting comment:', error)
      setCommentError('Network error. Please try again.')
    } finally {
      setPostingComment(false)
    }
  }

  const startEditComment = (comment) => {
    setEditingCommentId(comment._id)
    setEditingText(comment.content)
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingText('')
  }

  const handleUpdateComment = async (commentId) => {
    if (!editingText.trim()) return
    try {
      const res = await api.updateComment(commentId, editingText.trim(), token)
      if (res.success) {
        setComments((prev) => prev.map((c) => (c._id === commentId ? res.comment : c)))
        cancelEditComment()
      }
    } catch (error) {
      console.error('❌ Error updating comment:', error)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!token) return
    try {
      const res = await api.deleteComment(commentId, token)
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId))
      }
    } catch (error) {
      console.error('❌ Error deleting comment:', error)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-20 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading article...
          </p>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-20 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Article Not Found</h1>
          <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Link 
            to="/articles" 
            className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors inline-block"
          >
            Browse All Articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-12 md:pb-16 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container-custom relative z-10 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {/* Category & Read Time */}
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
              <span className="px-3 py-1 bg-yellow-500 text-gray-900 text-xs font-semibold rounded-full">
                {article.category}
              </span>
              {article.readTime && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-gray-200 text-xs font-semibold rounded-full">
                  {article.readTime}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight text-white mb-4 sm:mb-5">
              {article.title}
            </h1>

            {/* Author & Date */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-300 text-sm sm:text-base">
              <span>By {article.author || 'Vaahan Team'}</span>
              <span>•</span>
              <span>{article.date || 'Coming Soon'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className={`py-8 sm:py-12 md:py-16 transition-colors duration-300 ${isDark ? 'bg-dark-900' : 'bg-white'}`}>
        <div className="container-custom">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {/* Featured Image */}
            <img
              src={article.image}
              alt={article.title}
              className={`w-full rounded-xl mb-6 sm:mb-8 transition-colors duration-300 ${isDark ? 'shadow-lg shadow-dark-800' : 'shadow-md'}`}
            />

            {/* Article Content */}
            <div className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none ${isDark ? 'prose-invert' : ''}`}>
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className={`mt-6 sm:mt-8 pt-6 sm:pt-8 border-t transition-colors duration-300 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, idx) => (
                    <span key={idx} className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${
                      isDark ? 'bg-dark-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Upvote & Share Section */}
            <div className={`mt-6 sm:mt-8 pt-6 sm:pt-8 border-t transition-colors duration-300 flex flex-wrap items-center justify-between gap-3 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <button
                onClick={handleUpvote}
                disabled={upvoting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 disabled:opacity-60 ${
                  hasUpvoted
                    ? 'bg-yellow-500 text-gray-900'
                    : isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>👍</span>
                <span>{hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                <span className={hasUpvoted ? 'text-gray-800' : isDark ? 'text-gray-400' : 'text-gray-500'}>
                  ({upvotes})
                </span>
              </button>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                  isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  📤 Share
                </button>
                <button className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                  isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  🔖 Bookmark
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <section className={`py-8 sm:py-12 md:py-16 transition-colors duration-300 ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className={`text-xl sm:text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Comments ({comments.length})
            </h2>

            {/* New comment form */}
            <form onSubmit={handlePostComment} className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={() => { if (!token) setIsAuthModalOpen(true) }}
                placeholder={token ? 'Share your thoughts...' : 'Sign in to join the discussion...'}
                rows={3}
                maxLength={2000}
                className={`w-full rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors duration-300 ${
                  isDark ? 'bg-dark-900 text-white placeholder-gray-500 border border-dark-700' : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-200'
                }`}
              />
              {commentError && <p className="text-red-500 text-xs mt-2">{commentError}</p>}
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors duration-300"
                >
                  {postingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>

            {/* Comments list */}
            {commentsLoading ? (
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Be the first to comment on this article.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const commentUserId =
                    comment.user && typeof comment.user === 'object' ? comment.user._id : comment.user
                  const isOwn = !!currentUserId && commentUserId === currentUserId

                  return (
                    <div
                      key={comment._id}
                      className={`p-4 rounded-lg transition-colors duration-300 ${isDark ? 'bg-dark-900' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {comment.authorName || 'Member'}
                        </span>
                        <span className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                          {comment.isEdited ? ' (edited)' : ''}
                        </span>
                      </div>

                      {editingCommentId === comment._id ? (
                        <div className="mt-2">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={2}
                            maxLength={2000}
                            className={`w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                              isDark ? 'bg-dark-700 text-white border border-dark-600' : 'bg-gray-50 text-gray-900 border border-gray-200'
                            }`}
                          />
                          <div className="flex gap-3 mt-2">
                            <button
                              onClick={() => handleUpdateComment(comment._id)}
                              className="text-xs font-semibold text-yellow-500 hover:text-yellow-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditComment}
                              className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {comment.content}
                        </p>
                      )}

                      {isOwn && editingCommentId !== comment._id && (
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={() => startEditComment(comment)}
                            className={`text-xs font-semibold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-xs font-semibold text-red-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sign-in modal, opened whenever a guest tries to comment or upvote */}
      <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthModalClose} />

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <section className={`py-8 sm:py-12 md:py-16 transition-colors duration-300 ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
          <div className="container-custom">
            <h2 className={`text-xl sm:text-2xl font-bold mb-6 sm:mb-8 ${isDark ? 'text-white' : 'text-gray-900'} px-4 sm:px-0`}>
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 px-4 sm:px-0">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  to={`/article/${related.slug}`}
                  className={`group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
                    isDark ? 'bg-dark-900 hover:shadow-dark-800' : 'bg-white'
                  }`}
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className={`font-bold text-sm sm:text-base mb-2 line-clamp-2 transition-colors ${
                      isDark ? 'text-white group-hover:text-yellow-400' : 'text-gray-900 group-hover:text-yellow-500'
                    }`}>
                      {related.title}
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {related.readTime || '5 min read'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default ArticleDetail