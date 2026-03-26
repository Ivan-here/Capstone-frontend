import { apiFetch } from "./http";

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const communityService = {
  listPosts(filters = {}) {
    return apiFetch(`/api/community/posts${buildQuery(filters)}`);
  },

  getPost(postId) {
    return apiFetch(`/api/community/posts/${postId}`);
  },

  createPost(payload) {
    return apiFetch(`/api/community/posts`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updatePost(postId, payload) {
    return apiFetch(`/api/community/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deletePost(postId) {
    return apiFetch(`/api/community/posts/${postId}`, {
      method: "DELETE",
    });
  },

  listComments(postId) {
    return apiFetch(`/api/community/posts/${postId}/comments`);
  },

  addComment(postId, payload) {
    return apiFetch(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  deleteComment(postId, commentId) {
    return apiFetch(`/api/community/posts/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  updateReaction(postId, payload) {
    return apiFetch(`/api/community/posts/${postId}/reactions`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
