export function timeAgo(dateInput) {
  const ts = typeof dateInput === "string"
    ? new Date(dateInput).getTime()
    : new Date(dateInput).getTime();

  if (!Number.isFinite(ts)) return "just now";

  const diffMs = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(days / 365);
  return `${years} y ago`;
}

export function titleFromType(type, explicitTitle) {
  if (explicitTitle?.trim()) return explicitTitle.trim();
  if (!type) return "Notification";

  switch (String(type).toUpperCase()) {
    case "ALERT":
      return "Order Update";
    case "SUCCESS":
      return "Reservation Update";
    case "INFO":
      return "Update";
    case "COMMUNITY_COMMENT":
      return "New comment on your post";
    case "COMMUNITY_LIKE_MILESTONE":
      return "Post likes milestone";
    case "NEW_FOLLOWER":
      return "New follower";
    default: {
      const normalized = String(type).toLowerCase().replace(/_/g, " ");
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
  }
}
