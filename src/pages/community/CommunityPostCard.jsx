import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { followService } from "@/services/follow.service"; // <-- Import the new service
import {
  displayTime,
  getAvatarFallback,
  getAuthorHandle,
  getAuthorLabel,
  getCreatorAccent,
  getCreatorTypeLabel,
  getPreviewComments,
  getReactionForUser,
} from "./community.utils";

function Avatar({ label, avatarUrl, className = "community-avatar" }) {
  const initial = getAvatarFallback(label);
  return (
      <div className={className}>
        {avatarUrl ? (
            <img src={avatarUrl} alt={label || "User"} className="community-avatar-image" />
        ) : (
            initial
        )}
      </div>
  );
}

export default function CommunityPostCard({
                                            post,
                                            avatarUrls = {},
                                            currentUserId,
                                            isFollowing,
                                            reactionBusy = false,
                                            onReact,
                                            compact = false,
                                            showOpenPostAction = true,
                                            showFollowButton = true,
                                          }) {
  const navigate = useNavigate();
  const currentReaction = getReactionForUser(post, currentUserId);
  const commentCount = Array.isArray(post?.comments) ? post.comments.length : 0;
  const previewComments = compact ? getPreviewComments(post, 3) : [];
  const accent = getCreatorAccent(post);
  const hasImage = Boolean(post?.imageUrl);

  // LOCAL STATE: Manage the follow toggle optimistically for a snappy UI
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Keep local state in sync if the parent component forces an update
  useEffect(() => {
    setLocalIsFollowing(isFollowing);
  }, [isFollowing]);

  // THE FOLLOW HANDLER
  const handleFollowToggle = async () => {
    if (!currentUserId || post.userId === currentUserId) return;

    setIsFollowLoading(true);
    try {
      if (localIsFollowing) {
        await followService.unfollowUser(post.userId);
        setLocalIsFollowing(false);
      } else {
        await followService.followUser(post.userId);
        setLocalIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow status", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
      <article
          className={`community-post-card community-post-card--mockup community-post-card--${accent} ${
              hasImage ? "community-post-card--with-image" : "community-post-card--no-image"
          }`}
      >
        {hasImage && (
            <div className="community-post-media-column">
              <img src={post.imageUrl} alt={post.title || "Community post"} className="community-post-image community-post-image--mockup" />
            </div>
        )}

        <div className="community-post-content-column">
          <div className="community-post-header community-post-header--mockup">
            <div className="community-post-author">
              <Avatar label={getAuthorLabel(post)} avatarUrl={avatarUrls[post.userId]} />
              <div>
                <div className="community-post-author-name">{getAuthorLabel(post)}</div>
                <div className="community-post-meta">
                  {getAuthorHandle(post)}
                  {getAuthorHandle(post) ? " · " : ""}
                  {getCreatorTypeLabel(post)}
                  {" · "}
                  {displayTime(post?.createdAt)}
                </div>
              </div>
            </div>

            {/* FOLLOW BUTTON INTEGRATION */}
            {/* We hide the button if it's the current user's own post */}
            {showFollowButton && currentUserId !== post.userId && (
                <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    style={{ cursor: isFollowLoading ? 'wait' : 'pointer' }}
                    className={`community-follow-btn ${localIsFollowing ? "is-following" : ""}`}
                >
                  {isFollowLoading ? "..." : localIsFollowing ? "Following" : "Follow"}
                </button>
            )}
          </div>

          <div className="community-post-body community-post-body--mockup">
            <h3 className="community-post-title">{post?.title}</h3>
            <p className="community-post-content">
              {compact && String(post?.content || "").length > 180
                  ? `${String(post.content).slice(0, 180)}...`
                  : post?.content}
            </p>
            {!!post?.tags?.length && (
                <div className="community-tags-row community-tags-row--mockup">
                  {post.tags.map((tag) => (
                      <span key={`${post.id}-${tag}`} className="community-tag">#{tag}</span>
                  ))}
                </div>
            )}
          </div>

          {previewComments.length > 0 && (
              <div className="community-comment-preview-list community-comment-preview-list--boxed">
                {previewComments.map((comment) => (
                    <div key={comment.id} className="community-comment-preview-item community-comment-preview-item--stacked">
                      <Avatar
                          label={comment.displayName || comment.username || "User"}
                          avatarUrl={avatarUrls[comment.userId]}
                          className="community-comment-preview-avatar"
                      />
                      <div className="community-comment-preview-body">
                        <div className="community-comment-preview-name">
                          {comment.displayName || comment.username || "User"}
                        </div>
                        <div className="community-comment-preview-text">{comment.text}</div>
                      </div>
                    </div>
                ))}
              </div>
          )}

          <div className="community-post-footer community-post-footer--mockup">
            <div className="community-reaction-row community-reaction-row--single">
              <button
                  type="button"
                  className={`community-heart-btn ${currentReaction === "LIKE" ? "active" : ""}`}
                  onClick={() => onReact?.(post, currentReaction === "LIKE" ? null : "LIKE")}
                  disabled={reactionBusy || !currentUserId}
                  aria-label={currentReaction === "LIKE" ? "Remove like" : "Like post"}
              >
                <span className="community-heart-emoji" aria-hidden="true">❤️</span>
                <span>{post?.likeCount || 0} likes</span>
              </button>
              <span className="community-comment-count">{commentCount} comments</span>
            </div>

            {showOpenPostAction && (
                <button
                    type="button"
                    className="community-open-post-link"
                    onClick={() => navigate(`/community/posts/${post.id}`)}
                >
                  Open post
                </button>
            )}
          </div>
        </div>
      </article>
  );
}