import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { followService } from "@/services/follow.service";
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

function getProfilePath(userId, currentUserId) {
  if (!userId) return null;
  return userId === currentUserId ? "/profile" : `/profile/${userId}`;
}

function Avatar({ label, avatarUrl, className = "community-avatar", userId, currentUserId }) {
  const initial = getAvatarFallback(label);
  const profilePath = getProfilePath(userId, currentUserId);
  const content = (
      <div className={className}>
        {avatarUrl ? (
            <img src={avatarUrl} alt={label || "User"} className="community-avatar-image" />
        ) : (
            initial
        )}
      </div>
  );

  if (!profilePath) return content;

  return (
      <Link to={profilePath} className="community-avatar-link" aria-label={`Open ${label || "user"} profile`}>
        {content}
      </Link>
  );
}

export default function CommunityPostCard({
  post,
  avatarUrls = {},
  currentUserId,
  isFollowing,
  reactionBusy = false,
  onReact,
  onFollowChange,
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
  const isOwnPost = Boolean(currentUserId) && currentUserId === post?.userId;
  const canFollow = showFollowButton && Boolean(currentUserId) && Boolean(post?.userId) && !isOwnPost;

  const [localIsFollowing, setLocalIsFollowing] = useState(Boolean(isFollowing));
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    setLocalIsFollowing(Boolean(isFollowing));
  }, [isFollowing]);

  const handleFollowToggle = async () => {
    if (!canFollow) return;

    setIsFollowLoading(true);
    try {
      if (localIsFollowing) {
        await followService.unfollowUser(post.userId);
        setLocalIsFollowing(false);
        onFollowChange?.(post.userId, false);
      } else {
        await followService.followUser(post.userId);
        setLocalIsFollowing(true);
        onFollowChange?.(post.userId, true);
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
              <Avatar
                  label={getAuthorLabel(post)}
                  avatarUrl={avatarUrls[post.userId]}
                  userId={post?.userId}
                  currentUserId={currentUserId}
              />
              <div>
                <Link
                          to={getProfilePath(post?.userId, currentUserId) || "#"}
                          className="community-author-link"
                          onClick={(event) => { if (!post?.userId) event.preventDefault(); }}
                      >
                        <div className="community-post-author-name">{getAuthorLabel(post)}</div>
                      </Link>
                <div className="community-post-meta">
                  {getAuthorHandle(post)}
                  {getAuthorHandle(post) ? " · " : ""}
                  {getCreatorTypeLabel(post)}
                  {" · "}
                  {displayTime(post?.createdAt)}
                </div>
              </div>
            </div>

            {showFollowButton && isOwnPost && (
                <span className="community-follow-badge community-follow-badge--self">Your post</span>
            )}

            {canFollow && (
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
                          userId={comment?.userId}
                          currentUserId={currentUserId}
                      />
                      <div className="community-comment-preview-body">
                        <Link
                            to={getProfilePath(comment?.userId, currentUserId) || "#"}
                            className="community-author-link"
                            onClick={(event) => { if (!comment?.userId) event.preventDefault(); }}
                        >
                          <div className="community-comment-preview-name">
                            {comment.displayName || comment.username || "User"}
                          </div>
                        </Link>
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
