export function timeAgo(dateInput) {
  const ts = typeof dateInput === "string"
    ? new Date(dateInput).getTime()
    : new Date(dateInput).getTime();

  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return `${days} d ago`;
}

export function titleFromType(type) {
  if (!type) return "Notification";
  const t = type.toLowerCase();

  if (t === "alert") return "Order Update";
  if (t === "success") return "Reservation Update";
  if (t === "info") return "Update";

  return t.charAt(0).toUpperCase() + t.slice(1);
}