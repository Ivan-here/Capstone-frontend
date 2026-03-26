import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { communityService } from "../../services/community.service";
import { profileService } from "../../services/profile.service";
import CommunityPostCard from "./CommunityPostCard";
import "./Community.css";

export default function CommunityPostPage() {
  const { postId } = useParams();
  const currentUserId = authService.getUserId();
  const isLoggedIn = authService.isLoggedIn();

  const [post, setPost] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);


  const loadPost = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await communityService.getPost(postId);
      setPost(data);
    } catch (e) {
      setError(e.message || "Failed to load the post.");
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  useEffect(() => {
    if (!isLoggedIn) {
      setMe(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await profileService.getMe();
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const followingIds = useMemo(() => {
    const ids = new Set();
    (me?.personalProfile?.followingPeople || []).forEach((person) => {
      if (person?.id) ids.add(person.id);
    });
    return ids;
  }, [me]);

  const handleReact = async (_, reactionType) => {
    if (!currentUserId || !post) return;
    try {
      setReactionBusy(true);
      const updated = await communityService.updateReaction(post.id, { userId: currentUserId, reactionType });
      setPost(updated);
    } catch (e) {
      setError(e.message || "Failed to update reaction.");
    } finally {
      setReactionBusy(false);
    }
  };


  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!currentUserId || !commentText.trim() || !post) return;

    try {
      setCommentBusy(true);
      setError("");
      const updated = await communityService.addComment(post.id, {
        userId: currentUserId,
        text: commentText.trim(),
      });
      setPost(updated);
      setCommentText("");
    } catch (e) {
      setError(e.message || "Failed to add comment.");
    } finally {
      setCommentBusy(false);
    }
  };

  return (
    <div className="community-page-shell">
      <div className="community-page community-page--post">
        <div className="community-page-header">
          <div>
            <h1 className="community-page-title">Post</h1>
                      </div>
          <Link to="/community" className="community-secondary-btn community-link-btn">Back to feed</Link>
        </div>

        {error && <div className="community-status community-status--error">{error}</div>}
        {loading && <div className="community-status">Loading post...</div>}

        {!loading && !post && !error && <div className="community-status">Post not found.</div>}

        {!loading && post && (
          <>
            <CommunityPostCard
              post={post}
              currentUserId={currentUserId}
              isFollowing={followingIds.has(post.userId)}
              reactionBusy={reactionBusy}
              onReact={handleReact}
              showOpenPostAction={false}
            />

            <div className="community-panel-card">
              <h2 className="community-section-title">Comments</h2>
              <form className="community-comment-form" onSubmit={handleCommentSubmit}>
                <textarea
                  className="community-textarea"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder={currentUserId ? "Write a comment..." : "Log in to comment"}
                  disabled={!currentUserId || commentBusy}
                />
                <div className="community-actions-row">
                  <button className="community-primary-btn" type="submit" disabled={!currentUserId || commentBusy || !commentText.trim()}>
                    {commentBusy ? "Posting..." : "Reply"}
                  </button>
                </div>
              </form>

              <div className="community-comments-list">
                {(post.comments || []).length === 0 && (
                  <div className="community-empty-copy">No comments yet.</div>
                )}

                {(post.comments || []).map((comment) => (
                  <div key={comment.id} className="community-comment-card">
                    <div className="community-comment-author">{comment.displayName || comment.username || "User"}</div>
                    <div className="community-comment-meta">@{comment.username || "user"}</div>
                    <p className="community-comment-text">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
