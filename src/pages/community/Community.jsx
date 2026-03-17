import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { communityService } from "../../services/community.service";
import { profileService } from "../../services/profile.service";
import { authService } from "../../services/auth.service";
import { timeAgo } from "../../utils/notification.utils";
import "./Community.css";

const TAB_OPTIONS = [
  { value: "COMMUNITY", label: "COMMUNITY" },
  { value: "BROWSE", label: "BROWSE" },
  { value: "NGO_HUB", label: "NGO HUB" },
];

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "FOLLOWING_ONLY", label: "Following only" },
];

const AUTHOR_HEADLINE_BY_TYPE = {
  USER: "User",
  BUSINESS: "Business",
  NGO: "NGO",
};

function Avatar({ seed }) {
  const initial = (seed || "?").trim().charAt(0).toUpperCase();
  return <div className="c-avatar">{initial}</div>;
}

function normalizeTabFromLocation(pathname, search) {
  if (pathname.startsWith("/ngo-hub")) return "NGO_HUB";

  const searchTab = new URLSearchParams(search).get("tab");
  if (["COMMUNITY", "BROWSE", "NGO_HUB"].includes(searchTab)) return searchTab;

  return "COMMUNITY";
}

function deriveAuthorType(profileData) {
  const businessType = String(profileData?.businessProfile?.businessType || "").toUpperCase();
  if (businessType === "NGO") return "NGO";
  if (businessType === "FARMER" || businessType === "RESTAURANT") return "BUSINESS";
  return "USER";
}

function deriveAuthorHeadline(profileData) {
  const business = profileData?.businessProfile;
  if (business?.businessName?.trim()) return business.businessName.trim();
  if (business?.name?.trim()) return business.name.trim();
  const businessType = String(business?.businessType || "").toUpperCase();
  if (businessType === "NGO") return "NGO";
  if (businessType === "FARMER") return "Farmer";
  if (businessType === "RESTAURANT") return "Restaurant";
  return profileData?.personalProfile?.displayName?.trim() || null;
}

function parseTags(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatRole(post) {
  if (post?.authorHeadline?.trim()) return post.authorHeadline.trim();
  return AUTHOR_HEADLINE_BY_TYPE[post?.authorType] || "User";
}

function formatDisplayName(post) {
  return post?.authorDisplayName || post?.authorUsername || "Unknown user";
}

function filterPost(post, query) {
  if (!query) return true;
  const haystack = [
    post.title,
    post.content,
    post.authorDisplayName,
    post.authorUsername,
    post.authorHeadline,
    ...(post.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function mapPostToForm(post) {
  return {
    title: post?.title || "",
    content: post?.content || "",
    imageUrl: post?.imageUrl || "",
    ctaText: post?.ctaText || "",
    ctaUrl: post?.ctaUrl || "",
    tags: Array.isArray(post?.tags) ? post.tags.join(", ") : "",
    visibility: post?.visibility || "PUBLIC",
    tab: post?.tab || "COMMUNITY",
  };
}

const Community = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { postId } = useParams();

  const currentUserId = authService.getUserId();
  const isLoggedIn = authService.isLoggedIn();

  const [activeTab, setActiveTab] = useState(() => normalizeTabFromLocation(location.pathname, location.search));
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [savingPost, setSavingPost] = useState(false);
  const [postError, setPostError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
    tags: "",
    visibility: "PUBLIC",
    tab: activeTab,
  });
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
    tags: "",
    visibility: "PUBLIC",
    tab: activeTab,
  });

  useEffect(() => {
    const nextTab = normalizeTabFromLocation(location.pathname, location.search);
    setActiveTab(nextTab);
    setPostForm((prev) => ({ ...prev, tab: nextTab }));
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isLoggedIn) {
      setProfileData(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await profileService.getMe();
        if (!cancelled) setProfileData(data);
      } catch {
        if (!cancelled) setProfileData(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");

        let tabToLoad = activeTab;
        if (postId) {
          const selectedPost = await communityService.getPost(postId);
          if (!cancelled && selectedPost?.tab) {
            if (selectedPost.tab !== activeTab) {
              tabToLoad = selectedPost.tab;
              setActiveTab(selectedPost.tab);
            }
            if (selectedPost.tab === "NGO_HUB" && !location.pathname.startsWith("/ngo-hub")) {
              navigate(`/ngo-hub/posts/${postId}`, { replace: true });
            }
            if (selectedPost.tab !== "NGO_HUB" && location.pathname.startsWith("/ngo-hub")) {
              navigate(`/community/posts/${postId}`, { replace: true });
            }
          }
        }

        const data = await communityService.listPosts(tabToLoad ? { tab: tabToLoad } : {});
        if (!cancelled) {
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load the community feed.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [activeTab, postId, location.pathname, navigate]);

  useEffect(() => {
    if (!postId || posts.length === 0) return;

    const node = document.getElementById(`community-post-${postId}`);
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [postId, posts]);

  const composerAuthorType = deriveAuthorType(profileData);
  const composerAuthorHeadline = deriveAuthorHeadline(profileData);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => filterPost(post, normalized));
  }, [posts, query]);

  const peopleInFeed = useMemo(() => {
    const seen = new Set();
    const people = [];

    filteredPosts.forEach((post) => {
      const key = post.userId || post.id;
      if (!seen.has(key)) {
        seen.add(key);
        people.push({
          id: key,
          name: formatDisplayName(post),
          role: formatRole(post),
          status: "online",
          userId: post.userId,
        });
      }
    });

    return people;
  }, [filteredPosts]);

  const handleTabChange = (tab) => {
    const basePath = tab === "NGO_HUB" ? "/ngo-hub" : "/community";
    const search = tab === "COMMUNITY" || tab === "NGO_HUB"
      ? ""
      : `?tab=${encodeURIComponent(tab)}`;

    navigate(`${basePath}${search}`);
  };

  const resetPostForm = () => {
    setPostForm({
      title: "",
      content: "",
      imageUrl: "",
      ctaText: "",
      ctaUrl: "",
      tags: "",
      visibility: "PUBLIC",
      tab: activeTab,
    });
  };

  const upsertPostInState = (updatedPost) => {
    setPosts((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== updatedPost.id);
      return [updatedPost, ...withoutCurrent].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();

    if (!currentUserId) {
      setPostError("You need to log in before you can create a post.");
      return;
    }

    try {
      setSavingPost(true);
      setPostError("");

      const created = await communityService.createPost({
        userId: currentUserId,
        title: postForm.title,
        content: postForm.content,
        tab: postForm.tab,
        visibility: postForm.visibility,
        authorType: composerAuthorType,
        authorHeadline: composerAuthorHeadline,
        imageUrl: postForm.imageUrl || null,
        ctaText: postForm.ctaText || null,
        ctaUrl: postForm.ctaUrl || null,
        tags: parseTags(postForm.tags),
      });

      upsertPostInState(created);
      resetPostForm();
      navigate(created.tab === "NGO_HUB" ? `/ngo-hub/posts/${created.id}` : `/community/posts/${created.id}`);
    } catch (e) {
      setPostError(e.message || "Failed to create the post.");
    } finally {
      setSavingPost(false);
    }
  };

  const startEditPost = (post) => {
    setEditingPostId(post.id);
    setEditForm(mapPostToForm(post));
    setPostError("");
  };

  const handleSaveEdit = async (postIdToSave) => {
    try {
      setSavingPost(true);
      setPostError("");

      const updated = await communityService.updatePost(postIdToSave, {
        userId: currentUserId,
        title: editForm.title,
        content: editForm.content,
        tab: editForm.tab,
        visibility: editForm.visibility,
        authorType: composerAuthorType,
        authorHeadline: composerAuthorHeadline,
        imageUrl: editForm.imageUrl || null,
        ctaText: editForm.ctaText || null,
        ctaUrl: editForm.ctaUrl || null,
        tags: parseTags(editForm.tags),
      });

      setPosts((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setEditingPostId(null);
      navigate(updated.tab === "NGO_HUB" ? `/ngo-hub/posts/${updated.id}` : `/community/posts/${updated.id}`);
    } catch (e) {
      setPostError(e.message || "Failed to update the post.");
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postToDelete) => {
    if (!window.confirm(`Delete \"${postToDelete.title}\"?`)) return;

    try {
      await communityService.deletePost(postToDelete.id);
      setPosts((prev) => prev.filter((item) => item.id !== postToDelete.id));
      if (postId === postToDelete.id) navigate(postToDelete.tab === "NGO_HUB" ? "/ngo-hub" : "/community");
    } catch (e) {
      setPostError(e.message || "Failed to delete the post.");
    }
  };

  const handleAddComment = async (post) => {
    const text = (commentDrafts[post.id] || "").trim();
    if (!text) return;

    if (!currentUserId) {
      setCommentError("You need to log in before you can comment.");
      return;
    }

    try {
      setCommentError("");
      const updatedPost = await communityService.addComment(post.id, {
        userId: currentUserId,
        text,
      });

      setPosts((prev) => prev.map((item) => item.id === updatedPost.id ? updatedPost : item));
      setCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));
    } catch (e) {
      setCommentError(e.message || "Failed to add the comment.");
    }
  };

  const handleDeleteComment = async (post, commentId) => {
    try {
      setCommentError("");
      const updatedPost = await communityService.deleteComment(post.id, commentId);
      setPosts((prev) => prev.map((item) => item.id === updatedPost.id ? updatedPost : item));
    } catch (e) {
      setCommentError(e.message || "Failed to delete the comment.");
    }
  };

  return (
    <div className="community-wrapper">
      <div className="community-container">
        <aside className="community-left">
          <div className="left-header">
            <div>
              <div className="left-title">Who you follow</div>
              <div className="left-subtitle">Currently powered by authors in this feed</div>
            </div>

            <input
              className="left-search"
              placeholder="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="follow-list">
            {peopleInFeed.map((person) => (
              <div key={person.id} className="follow-row">
                <div className="follow-avatar">
                  <Avatar seed={person.name} />
                </div>

                <div className="follow-meta">
                  <div className="follow-name">{person.name}</div>
                  <div className="follow-role">{person.role}</div>
                </div>

                <div className={`follow-dot ${person.status}`} />
              </div>
            ))}

            {!loading && peopleInFeed.length === 0 && (
              <div className="community-empty-side">No authors match your search yet.</div>
            )}
          </div>

          <button className="left-seeall" type="button">See all</button>
        </aside>

        <main className="community-feed">
          <section className="community-toolbar-card">
            <div className="community-tab-row">
              {TAB_OPTIONS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`community-tab-chip ${activeTab === tab.value ? "active" : ""}`}
                  onClick={() => handleTabChange(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="community-toolbar-copy">
              {activeTab === "COMMUNITY" && "Public feed for community posts."}
              {activeTab === "BROWSE" && "Business and discovery-oriented posts."}
              {activeTab === "NGO_HUB" && "NGO-specific announcements and coordination."}
            </div>
          </section>

          <section className="community-composer-card">
            <div className="composer-title-row">
              <div>
                <h2 className="composer-title">Create a post</h2>
                <p className="composer-subtitle">Make a post!</p>
              </div>
              {isLoggedIn && (
                <div className="composer-meta-chip">
                  {composerAuthorType} · {composerAuthorHeadline || "Identity-backed author"}
                </div>
              )}
            </div>

            {!isLoggedIn ? (
              <div className="community-login-hint">Log in to create posts and comments.</div>
            ) : (
              <form className="composer-form" onSubmit={handleCreatePost}>
                <div className="composer-grid composer-grid--top">
                  <input
                    className="composer-input"
                    placeholder="Post title"
                    value={postForm.title}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <select
                    className="composer-select"
                    value={postForm.tab}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, tab: e.target.value }))}
                  >
                    {TAB_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    className="composer-select"
                    value={postForm.visibility}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, visibility: e.target.value }))}
                  >
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  className="composer-textarea"
                  placeholder="Write your post..."
                  value={postForm.content}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />

                <div className="composer-grid">
                  <input
                    className="composer-input"
                    placeholder="Image URL (optional)"
                    value={postForm.imageUrl}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  />
                  <input
                    className="composer-input"
                    placeholder="CTA text (optional)"
                    value={postForm.ctaText}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                  />
                  <input
                    className="composer-input"
                    placeholder="CTA URL (optional)"
                    value={postForm.ctaUrl}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                  />
                </div>

                <div className="composer-grid composer-grid--bottom">
                  <input
                    className="composer-input"
                    placeholder="Tags separated by commas"
                    value={postForm.tags}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                  <div className="composer-actions">
                    <button type="button" className="composer-secondary-btn" onClick={resetPostForm}>Clear</button>
                    <button type="submit" className="composer-primary-btn" disabled={savingPost}>
                      {savingPost ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {postError && <div className="community-form-error">{postError}</div>}
            {commentError && <div className="community-form-error">{commentError}</div>}
          </section>

          {loading && <div className="community-status-card">Loading the community feed...</div>}
          {error && <div className="community-status-card community-status-card--error">{error}</div>}

          {!loading && !error && filteredPosts.length === 0 && (
            <div className="community-status-card">No posts yet for this tab.</div>
          )}

          {!loading && !error && filteredPosts.map((post) => {
            const isOwner = currentUserId && post.userId === currentUserId;
            const isHighlighted = postId === post.id;
            const postComments = Array.isArray(post.comments) ? post.comments : [];

            return (
              <article
                key={post.id}
                id={`community-post-${post.id}`}
                className={`post-card ${isHighlighted ? "post-card--highlighted" : ""}`}
              >
                <div className="post-header">
                  <div className="post-user">
                    <div className="post-user-avatar">
                      <Avatar seed={formatDisplayName(post)} />
                    </div>
                    <div className="post-user-meta">
                      <div className="post-author-row">
                        <div className="post-author">{formatDisplayName(post)}</div>
                        {post.authorUsername && <div className="post-username">@{post.authorUsername}</div>}
                      </div>
                      <div className="post-time">
                        {timeAgo(post.createdAt)} · {formatRole(post)} · {post.visibility === "FOLLOWING_ONLY" ? "Followers" : "Public"}
                      </div>
                    </div>
                  </div>

                  <div className="post-header-actions">
                    <span className="post-chip">{post.tab}</span>
                    {isOwner && editingPostId !== post.id && (
                      <>
                        <button type="button" className="post-link-btn" onClick={() => startEditPost(post)}>Edit</button>
                        <button type="button" className="post-link-btn post-link-btn--danger" onClick={() => handleDeletePost(post)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>

                {editingPostId === post.id ? (
                  <div className="post-edit-card">
                    <div className="composer-grid composer-grid--top">
                      <input
                        className="composer-input"
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      />
                      <select
                        className="composer-select"
                        value={editForm.tab}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, tab: e.target.value }))}
                      >
                        {TAB_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <select
                        className="composer-select"
                        value={editForm.visibility}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, visibility: e.target.value }))}
                      >
                        {VISIBILITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      className="composer-textarea"
                      value={editForm.content}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                      rows={4}
                    />

                    <div className="composer-grid">
                      <input
                        className="composer-input"
                        placeholder="Image URL"
                        value={editForm.imageUrl}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      />
                      <input
                        className="composer-input"
                        placeholder="CTA text"
                        value={editForm.ctaText}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                      />
                      <input
                        className="composer-input"
                        placeholder="CTA URL"
                        value={editForm.ctaUrl}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, ctaUrl: e.target.value }))}
                      />
                    </div>

                    <div className="composer-grid composer-grid--bottom">
                      <input
                        className="composer-input"
                        placeholder="Tags separated by commas"
                        value={editForm.tags}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                      />
                      <div className="composer-actions">
                        <button type="button" className="composer-secondary-btn" onClick={() => setEditingPostId(null)}>Cancel</button>
                        <button type="button" className="composer-primary-btn" onClick={() => handleSaveEdit(post.id)} disabled={savingPost}>
                          {savingPost ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`post-body ${post.imageUrl ? "has-image" : "no-image"}`}>
                      {post.imageUrl && (
                        <div className="post-image">
                          <img src={post.imageUrl} alt={post.title} />
                        </div>
                      )}

                      <div className="post-comments">
                        <div className="post-copy">
                          <div className="post-title">{post.title}</div>
                          <div className="post-caption">{post.content}</div>

                          {(post.tags || []).length > 0 && (
                            <div className="post-tags">
                              {post.tags.map((tag) => (
                                <span key={tag} className="post-tag">#{tag}</span>
                              ))}
                            </div>
                          )}

                          {(post.ctaText || post.ctaUrl) && (
                            <div className="post-cta-row">
                              {post.ctaUrl ? (
                                <a className="post-cta-btn" href={post.ctaUrl} target="_blank" rel="noreferrer">
                                  {post.ctaText || "Open link"}
                                </a>
                              ) : (
                                <span className="post-cta-label">{post.ctaText}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="comment-list">
                          {postComments.map((comment) => {
                            const canDeleteComment = currentUserId && (comment.userId === currentUserId || post.userId === currentUserId);

                            return (
                              <div key={comment.id} className="comment-row">
                                <div className="comment-user">
                                  <Avatar seed={comment.displayName || comment.username} />
                                </div>

                                <div className="comment-content">
                                  <div className="comment-top">
                                    <span className="comment-name">{comment.displayName || comment.username || "User"}</span>
                                    <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                                  </div>
                                  {comment.username && <div className="comment-username">@{comment.username}</div>}
                                  <div className="comment-text">{comment.text}</div>
                                  {canDeleteComment && (
                                    <div className="comment-actions">
                                      <button
                                        type="button"
                                        className="comment-link comment-link--danger"
                                        onClick={() => handleDeleteComment(post, comment.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {postComments.length === 0 && (
                            <div className="comment-empty">No comments yet. Start the thread.</div>
                          )}
                        </div>

                        <div className="comment-form">
                          <input
                            className="comment-input"
                            placeholder={isLoggedIn ? "Write a comment..." : "Log in to comment"}
                            value={commentDrafts[post.id] || ""}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            disabled={!isLoggedIn}
                          />
                          <button
                            type="button"
                            className="comment-submit-btn"
                            onClick={() => handleAddComment(post)}
                            disabled={!isLoggedIn || !(commentDrafts[post.id] || "").trim()}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="post-footer">
                      <div className="post-likes">{post.likeCount || 0} likes</div>
                      <div className="post-footer-right">
                        <button type="button" className="post-link-btn" onClick={() => navigate(post.tab === "NGO_HUB" ? `/ngo-hub/posts/${post.id}` : `/community/posts/${post.id}`)}>
                          Open post
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </main>
      </div>
    </div>
  );
};

export default Community;
