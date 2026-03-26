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

export function buildSidebarProfiles(me, posts) {
  const following = me?.personalProfile?.followingPeople || [];
  const typeByUserId = new Map(
    (posts || []).map((post) => [post.userId, getCreatorTypeLabel(post)]),
  );

  if (following.length > 0) {
    return following.map((person) => ({
      id: person?.id || person?.userId || person?.username || Math.random().toString(36),
      name: person?.displayName || person?.username || "User",
      handle: person?.username ? `@${person.username}` : "",
      type: typeByUserId.get(person?.id) || "User",
    }));
  }

  const seen = new Set();
  return (posts || [])
    .filter((post) => {
      if (!post?.userId || seen.has(post.userId)) return false;
      seen.add(post.userId);
      return true;
    })
    .slice(0, 8)
    .map((post) => ({
      id: post.userId,
      name: getAuthorLabel(post),
      handle: getAuthorHandle(post),
      type: getCreatorTypeLabel(post),
    }));
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
