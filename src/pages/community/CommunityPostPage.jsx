import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { communityService } from "../../services/community.service";
import { profileService } from "../../services/profile.service";
import { followService } from "../../services/follow.service";
import CommunityPostCard from "./CommunityPostCard";
import { getAvatarFallback, getProfileAvatarUrl, mergeAvatarMap } from "./community.utils";
import "./Community.css";

function getProfilePath(userId, currentUserId) {
  if (!userId) return null;
  return userId === currentUserId ? "/profile" : `/profile/${userId}`;
}

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
  const [avatarUrls, setAvatarUrls] = useState({});
  const [followingIds, setFollowingIds] = useState(new Set());
  const pendingAvatarIdsRef = useRef(new Set());

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

  const loadFollowing = async () => {
    if (!currentUserId) {
      setFollowingIds(new Set());
      return;
    }

    try {
      const followingData = await followService.getFollowing(currentUserId);
      const ids = new Set((Array.isArray(followingData) ? followingData : []).map((item) => item?.user?.id).filter(Boolean));
      setFollowingIds(ids);
    } catch (e) {
      console.error("Failed to fetch following ids", e);
      setFollowingIds(new Set());
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

  useEffect(() => {
    loadFollowing();
  }, [currentUserId]);

  useEffect(() => {
    if (!post) return;

    const userIds = new Set();
    if (post.userId) userIds.add(post.userId);
    (post.comments || []).forEach((comment) => {
      if (comment?.userId) userIds.add(comment.userId);
    });

    let cancelled = false;
    const known = {};
    if (currentUserId && me) {
      known[currentUserId] = getProfileAvatarUrl(me);
    }

    if (Object.keys(known).length > 0) {
      setAvatarUrls((prev) => mergeAvatarMap(prev, known));
    }

    const pendingIds = pendingAvatarIdsRef.current;
    const missingUserIds = Array.from(userIds).filter(
      (userId) => !(userId in avatarUrls) && !(userId in known) && !pendingIds.has(userId),
    );
    if (missingUserIds.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    missingUserIds.forEach((userId) => pendingIds.add(userId));

    (async () => {
      const results = await Promise.allSettled(
        missingUserIds.map(async (userId) => {
          const profile = await profileService.getProfileById(userId);
          return [userId, getProfileAvatarUrl(profile)];
        }),
      );

      missingUserIds.forEach((userId) => pendingIds.delete(userId));
      if (cancelled) return;

      const next = {};
      results.forEach((result, index) => {
        const fallbackUserId = missingUserIds[index];
        if (result.status === "fulfilled") {
          const [userId, avatarUrl] = result.value;
          next[userId] = avatarUrl;
        } else if (fallbackUserId) {
          next[fallbackUserId] = "";
        }
      });

      setAvatarUrls((prev) => mergeAvatarMap(prev, next));
    })();

    return () => {
      cancelled = true;
    };
  }, [post, me, currentUserId]);

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

  const handleFollowChange = (targetUserId, nextIsFollowing) => {
    if (!targetUserId) return;
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (nextIsFollowing) next.add(targetUserId);
      else next.delete(targetUserId);
      return next;
    });
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
              avatarUrls={avatarUrls}
              currentUserId={currentUserId}
              isFollowing={followingIds.has(post.userId)}
              reactionBusy={reactionBusy}
              onReact={handleReact}
              onFollowChange={handleFollowChange}
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
                    <div className="community-comment-preview-item community-comment-preview-item--stacked">
                      <Link
                        to={getProfilePath(comment?.userId, currentUserId) || "#"}
                        className="community-avatar-link"
                        onClick={(event) => { if (!comment?.userId) event.preventDefault(); }}
                        aria-label={`Open ${(comment.displayName || comment.username || "user")} profile`}
                      >
                        <div className="community-comment-preview-avatar">
                          {avatarUrls[comment.userId] ? (
                            <img
                              src={avatarUrls[comment.userId]}
                              alt={comment.displayName || comment.username || "User"}
                              className="community-avatar-image"
                            />
                          ) : (
                            getAvatarFallback(comment.displayName || comment.username || "User")
                          )}
                        </div>
                      </Link>
                      <div className="community-comment-preview-body">
                        <Link
                          to={getProfilePath(comment?.userId, currentUserId) || "#"}
                          className="community-author-link"
                          onClick={(event) => { if (!comment?.userId) event.preventDefault(); }}
                        >
                          <div className="community-comment-author">{comment.displayName || comment.username || "User"}</div>
                        </Link>
                        <div className="community-comment-meta">@{comment.username || "user"}</div>
                        <p className="community-comment-text">{comment.text}</p>
                      </div>
                    </div>
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
