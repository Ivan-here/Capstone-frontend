import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { communityService } from "../../services/community.service";
import { profileService } from "../../services/profile.service";
import { authService } from "../../services/auth.service";
import CommunityPostCard from "./CommunityPostCard";
import { buildSidebarProfiles, getAvatarFallback, getProfileAvatarUrl, matchesCommunityFilters } from "./community.utils";
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

  const [posts, setPosts] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reactionBusyId, setReactionBusyId] = useState("");
  const [avatarUrls, setAvatarUrls] = useState({});
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
    const userIds = new Set();

    (posts || []).forEach((post) => {
      if (post?.userId) userIds.add(post.userId);
      (post?.comments || []).forEach((comment) => {
        if (comment?.userId) userIds.add(comment.userId);
      });
    });

    if (!userIds.size) return;

    let cancelled = false;
    const known = {};
    if (currentUserId && me) {
      known[currentUserId] = getProfileAvatarUrl(me);
    }

    setAvatarUrls((prev) => ({ ...prev, ...known }));

    const missingUserIds = Array.from(userIds).filter((userId) => !(userId in avatarUrls) && !(userId in known));
    if (missingUserIds.length === 0) return;

    (async () => {
      const results = await Promise.allSettled(
        missingUserIds.map(async (userId) => {
          const profile = await profileService.getProfileById(userId);
          return [userId, getProfileAvatarUrl(profile)];
        }),
      );

      if (cancelled) return;

      const next = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const [userId, avatarUrl] = result.value;
          next[userId] = avatarUrl;
        }
      });

      setAvatarUrls((prev) => ({ ...prev, ...next }));
    })();

    return () => {
      cancelled = true;
    };
  }, [posts, me, currentUserId]);

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

  const followingIds = useMemo(() => {
    const ids = new Set();
    (me?.personalProfile?.followingPeople || []).forEach((person) => {
      if (person?.id) ids.add(person.id);
    });
    return ids;
  }, [me]);

  const sidebarProfiles = useMemo(() => buildSidebarProfiles(me, posts), [me, posts]);

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
                  {me?.personalProfile?.followingPeople?.length
                    ? "Posts from creators you already follow"
                    : "People showing up in your current community feed"}
                </p>
              </div>
            </div>

            <div className="community-sidebar-search-wrap">
              <input
                className="community-input community-input--soft"
                placeholder="Search posts or creators"
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
            </div>

            <div className="community-sidebar-list">
              {sidebarProfiles.length === 0 && (
                <div className="community-empty-copy">No creators to show yet.</div>
              )}

              {sidebarProfiles.map((profile) => (
                <div key={profile.id} className="community-sidebar-item">
                  <div className="community-sidebar-person">
                    <SidebarAvatar name={profile.name} avatarUrl={avatarUrls[profile.id]} />
                    <div>
                      <div className="community-sidebar-name">{profile.name}</div>
                      <div className="community-sidebar-meta">
                        {profile.type}
                        {profile.handle ? ` · ${profile.handle}` : ""}
                      </div>
                    </div>
                  </div>
                  <span className="community-sidebar-dot" aria-hidden="true" />
                </div>
              ))}
            </div>
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
