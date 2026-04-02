import { timeAgo } from "../../utils/notification.utils";

export function getAuthorLabel(post) {
  if (post?.authorHeadline?.trim()) return post.authorHeadline.trim();
  if (post?.authorDisplayName?.trim()) return post.authorDisplayName.trim();
  if (post?.authorUsername?.trim()) return `@${post.authorUsername.trim()}`;
  return "User";
}

export function getAuthorHandle(post) {
  if (post?.authorUsername?.trim()) return `@${post.authorUsername.trim()}`;
  return "";
}

export function getReactionForUser(post, userId) {
  if (!userId || !Array.isArray(post?.reactions)) return null;
  return post.reactions.find((reaction) => reaction.userId === userId)?.reactionType || null;
}

export function normalizeTagsInput(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function displayTime(value) {
  return timeAgo(value);
}

export function getCreatorTypeLabel(post) {
  const value = String(post?.authorType || "USER").toUpperCase();
  if (value === "BUSINESS") return "Business";
  if (value === "NGO") return "NGO";
  return "User";
}

export function getCreatorAccent(post) {
  const value = String(post?.authorType || "USER").toUpperCase();
  if (value === "BUSINESS") return "restaurant";
  if (value === "NGO") return "ngo";
  return "user";
}

export function getPreviewComments(post, limit = 3) {
  if (!Array.isArray(post?.comments)) return [];
  return post.comments.slice(0, limit);
}

export function getAvatarFallback(value, fallback = "?") {
  return String(value || fallback).trim().charAt(0).toUpperCase() || fallback;
}

export function getProfileAvatarUrl(profileResponse) {
  const businessAvatar = profileResponse?.businessProfile?.avatarUrl?.trim();
  if (businessAvatar) return businessAvatar;

  const personalAvatar = profileResponse?.personalProfile?.avatarUrl?.trim();
  if (personalAvatar) return personalAvatar;

  return "";
}

export function buildSidebarProfiles(followingConnections = []) {
  return (followingConnections || [])
    .map((connection) => {
      const user = connection?.user || {};
      const normalizedId = user.id || user.userId || user.username || null;
      if (!normalizedId) return null;

      const rawDisplayName = String(user.displayName || "").trim();
      const rawUsername = String(user.username || "").trim();
      const rawRole = String(user.role || "").trim();

      return {
        id: normalizedId,
        name: rawDisplayName || (rawUsername ? `@${rawUsername}` : "User"),
        handle: rawUsername ? `@${rawUsername}` : "",
        type: rawRole || "User",
        avatarUrl: user.avatarUrl || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function matchesCommunityFilters(post, filters) {
  const query = String(filters.query || "").trim().toLowerCase();
  const creator = String(filters.creator || "").trim().toLowerCase();
  const tag = String(filters.tag || "").trim().toLowerCase();
  const creatorType = String(filters.creatorType || "").trim().toUpperCase();

  if (query) {
    const haystack = [
      post?.title,
      post?.content,
      post?.authorDisplayName,
      post?.authorUsername,
      post?.authorHeadline,
      ...(post?.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(query)) return false;
  }

  if (creator) {
    const creatorHaystack = [
      post?.authorDisplayName,
      post?.authorHeadline,
      post?.authorUsername ? `@${post.authorUsername}` : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!creatorHaystack.includes(creator)) return false;
  }

  if (tag) {
    const tagHaystack = (post?.tags || []).map((item) => String(item).toLowerCase());
    if (!tagHaystack.some((item) => item.includes(tag))) return false;
  }

  if (creatorType) {
    if (String(post?.authorType || "USER").toUpperCase() !== creatorType) return false;
  }

  return true;
}


export function mergeAvatarMap(previous = {}, nextEntries = {}) {
  const safePrevious = previous || {};
  const safeNextEntries = nextEntries || {};
  const entries = Object.entries(safeNextEntries).filter(([key]) => Boolean(key));

  if (entries.length === 0) return safePrevious;

  let changed = false;
  const merged = { ...safePrevious };

  entries.forEach(([key, value]) => {
    const normalizedValue = value || "";
    if (merged[key] !== normalizedValue) {
      merged[key] = normalizedValue;
      changed = true;
    }
  });

  return changed ? merged : safePrevious;
}
