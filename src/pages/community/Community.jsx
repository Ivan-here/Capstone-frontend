import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users } from 'lucide-react';
import { communityService } from "@/services/community.service.js";
import { profileService } from "@/services/profile.service.js";
import { authService } from "@/services/auth.service.js";
import { followService } from "@/services/follow.service.js";
import CommunityPostCard from "./CommunityPostCard";
import { buildSidebarProfiles, getAvatarFallback, getProfileAvatarUrl, matchesCommunityFilters, mergeAvatarMap } from "./community.utils";
import "./Community.css";

function SidebarAvatar({ name, avatarUrl }) {
  const initial = getAvatarFallback(name);
  return (
      <div className="community-sidebar-avatar">
        {avatarUrl ? (
            <img src={avatarUrl} alt={name || "User"} className="community-avatar-image" />
        ) : (
            initial
        )}
      </div>
  );
}

export default function Community() {
  const currentUserId = authService.getUserId();
  const isLoggedIn = authService.isLoggedIn();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reactionBusyId, setReactionBusyId] = useState("");
  const [avatarUrls, setAvatarUrls] = useState({});
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followingConnections, setFollowingConnections] = useState([]);
  const [sidebarQuery, setSidebarQuery] = useState("");
  const pendingAvatarIdsRef = useRef(new Set());
  const [filters, setFilters] = useState({
    query: "",
    creator: "",
    tag: "",
    creatorType: "",
  });

  const loadFeed = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await communityService.listPosts({ tab: "COMMUNITY" });
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load community posts.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (!currentUserId) {
      setFollowingIds(new Set());
      setFollowingConnections([]);
      return;
    }

    try {
      const followingData = await followService.getFollowing(currentUserId);
      const normalized = Array.isArray(followingData) ? followingData : [];
      setFollowingConnections(normalized);
      setFollowingIds(new Set(normalized.map((item) => item?.user?.id).filter(Boolean)));
    } catch (e) {
      console.error("Failed to fetch following ids", e);
      setFollowingIds(new Set());
      setFollowingConnections([]);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

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
    const userIds = new Set();

    (posts || []).forEach((post) => {
      if (post?.userId) userIds.add(post.userId);
      (post?.comments || []).forEach((comment) => {
        if (comment?.userId) userIds.add(comment.userId);
      });
    });

    followingConnections.forEach((connection) => {
      if (connection?.user?.id) userIds.add(connection.user.id);
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
  }, [posts, me, currentUserId, followingConnections]);

  const creatorSuggestions = useMemo(() => {
    const seen = new Map();
    posts.forEach((post) => {
      if (!post?.userId || seen.has(post.userId)) return;
      const pieces = [post.authorDisplayName, post.authorHeadline, post.authorUsername ? `@${post.authorUsername}` : ""]
          .filter(Boolean)
          .join(" · ");
      seen.set(post.userId, pieces || "User");
    });
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const tagSuggestions = useMemo(() => {
    const seen = new Set();
    posts.forEach((post) => (post.tags || []).forEach((tag) => seen.add(tag)));
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const sidebarProfiles = useMemo(() => buildSidebarProfiles(followingConnections), [followingConnections]);

  const filteredSidebarProfiles = useMemo(() => {
    const query = String(sidebarQuery || "").trim().toLowerCase();
    if (!query) return sidebarProfiles;

    return sidebarProfiles.filter((profile) => {
      const haystack = [profile.name, profile.handle, profile.type].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [sidebarProfiles, sidebarQuery]);

  const filteredPosts = useMemo(
      () => posts.filter((post) => matchesCommunityFilters(post, filters)),
      [posts, filters],
  );

  const handleReact = async (post, reactionType) => {
    if (!currentUserId) return;
    try {
      setReactionBusyId(post.id);
      const updated = await communityService.updateReaction(post.id, { userId: currentUserId, reactionType });
      setPosts((prev) => prev.map((item) => (item.id === post.id ? updated : item)));
    } catch (e) {
      setError(e.message || "Failed to update reaction.");
    } finally {
      setReactionBusyId("");
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

    if (!nextIsFollowing) {
      setFollowingConnections((prev) => prev.filter((item) => item?.user?.id !== targetUserId));
      return;
    }

    const existingPost = posts.find((post) => post.userId === targetUserId);
    const fallbackConnection = existingPost
      ? {
          followId: `local-${targetUserId}`,
          user: {
            id: targetUserId,
            displayName: existingPost.authorDisplayName || existingPost.authorHeadline || existingPost.authorUsername || "User",
            username: existingPost.authorUsername || "",
            role: existingPost.authorType || "User",
            avatarUrl: avatarUrls[targetUserId] || "",
          },
        }
      : null;

    setFollowingConnections((prev) => {
      if (prev.some((item) => item?.user?.id === targetUserId)) return prev;
      return fallbackConnection ? [...prev, fallbackConnection] : prev;
    });
  };

  return (
      <div className="community-page-shell community-page-shell--mockup">
        <div className="community-page community-page--mockup">
          <div className="community-hero community-hero--tight">
            <h1 className="community-page-title community-page-title--mockup">Community</h1>
            <Link to="/community/create" className="community-primary-btn community-link-btn">
              Create post
            </Link>
          </div>

          <div className="community-layout-grid community-layout-grid--surface">
            <aside className="community-sidebar-card community-sidebar-card--mockup">
              <div className="community-sidebar-header">
                <div>
                  <h2 className="community-sidebar-title">Who you follow</h2>
                  <p className="community-sidebar-copy">
                    {followingIds.size > 0
                        ? "Only the people you already follow appear here."
                        : "You are not following anyone yet."}
                  </p>
                </div>
              </div>

              <div className="community-sidebar-search-wrap">
                <input
                    className="community-input community-input--soft"
                    placeholder="Search people you follow"
                    value={sidebarQuery}
                    onChange={(event) => setSidebarQuery(event.target.value)}
                />
              </div>

              <div className="community-sidebar-list">
                {filteredSidebarProfiles.length === 0 && (
                    <div className="community-empty-copy">No followed creators to show yet.</div>
                )}

                {filteredSidebarProfiles.map((profile) => (
                    <div key={profile.id} className="community-sidebar-item">
                      <Link to={`/profile/${profile.id}`} className="community-sidebar-link">
                        <div className="community-sidebar-person">
                          <SidebarAvatar
                              name={profile.name}
                              avatarUrl={profile.avatarUrl || avatarUrls[profile.id]}
                          />
                          <div>
                            <div className="community-sidebar-name">{profile.name}</div>
                            <div className="community-sidebar-meta">
                              {profile.type}
                              {profile.handle ? ` · ${profile.handle}` : ""}
                            </div>
                          </div>
                        </div>
                      </Link>
                      <span className="community-sidebar-dot" aria-hidden="true" />
                    </div>
                ))}
              </div>

              <button
                  onClick={() => navigate('/connections')}
                  style={{
                    width: '100%',
                    marginTop: '20px',
                    padding: '10px',
                    backgroundColor: 'transparent',
                    color: '#6D804B',
                    border: '1px solid #6D804B',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F5F2E8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Users size={18} /> Manage Connections
              </button>
            </aside>

            <section className="community-main-column">
              <div className="community-filters-card community-filters-card--mockup">
                <div className="community-filter-bar-title">Filter the feed</div>
                <div className="community-filters-grid community-filters-grid--mockup">
                  <div className="community-filter-search-field">
                    <input
                        className="community-input community-input--soft"
                        list="community-creator-suggestions"
                        value={filters.creator}
                        onChange={(event) => setFilters((prev) => ({ ...prev, creator: event.target.value }))}
                        placeholder="Search creators"
                    />
                    <datalist id="community-creator-suggestions">
                      {creatorSuggestions.map((creator) => (
                          <option key={creator} value={creator} />
                      ))}
                    </datalist>
                  </div>

                  <div className="community-filter-search-field">
                    <input
                        className="community-input community-input--soft"
                        list="community-tag-suggestions"
                        value={filters.tag}
                        onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}
                        placeholder="Search tags"
                    />
                    <datalist id="community-tag-suggestions">
                      {tagSuggestions.map((tag) => (
                          <option key={tag} value={tag} />
                      ))}
                    </datalist>
                  </div>

                  <select
                      className="community-input community-input--soft"
                      value={filters.creatorType}
                      onChange={(event) => setFilters((prev) => ({ ...prev, creatorType: event.target.value }))}
                  >
                    <option value="">All creator types</option>
                    <option value="USER">User</option>
                    <option value="BUSINESS">Business</option>
                    <option value="NGO">NGO</option>
                  </select>
                </div>
              </div>

              {error && <div className="community-status community-status--error">{error}</div>}
              {loading && <div className="community-status">Loading community feed...</div>}

              {!loading && filteredPosts.length === 0 && !error && (
                  <div className="community-status">No posts match the current filters.</div>
              )}

              <div className="community-feed-list community-feed-list--mockup">
                {filteredPosts.map((post) => (
                    <CommunityPostCard
                        key={post.id}
                        post={post}
                        avatarUrls={avatarUrls}
                        currentUserId={currentUserId}
                        isFollowing={followingIds.has(post.userId)}
                        reactionBusy={reactionBusyId === post.id}
                        onReact={handleReact}
                        onFollowChange={handleFollowChange}
                        compact
                    />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
  );
}
