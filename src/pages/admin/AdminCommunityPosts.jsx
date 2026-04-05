import React, { useEffect, useMemo, useState } from "react";
import { MessageSquareText, RefreshCw, Search } from "lucide-react";
import { adminService } from "@/services/admin.service";
import "./AdminShared.css";
import "./AdminCommunityPosts.css";

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

function countItems(items) {
    return Array.isArray(items) ? items.length : 0;
}

export default function AdminCommunityPosts() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [authorTypeFilter, setAuthorTypeFilter] = useState("");
    const [tabFilter, setTabFilter] = useState("");
    const [visibilityFilter, setVisibilityFilter] = useState("");
    const [selectedPost, setSelectedPost] = useState(null);
    const [moderationReason, setModerationReason] = useState("");
    const [deletingId, setDeletingId] = useState("");
    const [deletingCommentId, setDeletingCommentId] = useState("");

    useEffect(() => {
        loadPosts();
    }, []);

    async function loadPosts() {
        const selectedId = selectedPost?.id;
        try {
            setLoading(true);
            setError("");
            const data = await adminService.getAllCommunityPosts();
            const items = Array.isArray(data) ? data : [];
            setPosts(items);
            if (selectedId) {
                const refreshedSelected = items.find((item) => item.id === selectedId) || null;
                setSelectedPost(refreshedSelected);
            }
        } catch (err) {
            setError(err.message || "Failed to load community posts.");
        } finally {
            setLoading(false);
        }
    }

    const filteredPosts = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return posts.filter((item) => {
            const matchesSearch =
                !query ||
                item.id?.toLowerCase().includes(query) ||
                item.userId?.toLowerCase().includes(query) ||
                item.authorDisplayName?.toLowerCase().includes(query) ||
                item.authorUsername?.toLowerCase().includes(query) ||
                item.title?.toLowerCase().includes(query) ||
                item.content?.toLowerCase().includes(query) ||
                (item.tags || []).some((tag) => String(tag).toLowerCase().includes(query));

            const matchesAuthorType = !authorTypeFilter || item.authorType === authorTypeFilter;
            const matchesTab = !tabFilter || item.tab === tabFilter;
            const matchesVisibility = !visibilityFilter || item.visibility === visibilityFilter;

            return matchesSearch && matchesAuthorType && matchesTab && matchesVisibility;
        });
    }, [posts, searchTerm, authorTypeFilter, tabFilter, visibilityFilter]);

    async function selectPost(post) {
        try {
            const fullPost = await adminService.getCommunityPostById(post.id);
            setSelectedPost(fullPost);
            setModerationReason("");
        } catch (err) {
            alert(err.message || "Failed to load post details.");
        }
    }

    async function deletePost(post) {
        const reason = moderationReason.trim();
        if (!reason) {
            alert("Please provide a moderation reason before deleting this post.");
            return;
        }

        const confirmed = window.confirm("Delete this community post?");
        if (!confirmed) return;

        try {
            setDeletingId(post.id);
            await adminService.createModerationAction({
                targetType: "COMMUNITY_POST",
                targetId: post.id,
                action: "DELETE",
                reason,
                notes: `Post by ${post.authorDisplayName || post.authorUsername || post.userId || "unknown author"}`,
            });
            await adminService.deleteCommunityPost(post.id);
            setPosts((prev) => prev.filter((item) => item.id !== post.id));
            setSelectedPost(null);
            setModerationReason("");
        } catch (err) {
            alert(err.message || "Failed to delete post.");
        } finally {
            setDeletingId("");
        }
    }

    async function deleteComment(postId, comment) {
        const reason = moderationReason.trim();
        if (!reason) {
            alert("Please provide a moderation reason before deleting this comment.");
            return;
        }

        const confirmed = window.confirm("Delete this comment?");
        if (!confirmed) return;

        try {
            setDeletingCommentId(comment.id);
            await adminService.createModerationAction({
                targetType: "COMMUNITY_COMMENT",
                targetId: comment.id,
                action: "DELETE",
                reason,
                notes: `Comment on post ${postId} by ${comment.displayName || comment.username || comment.userId || "unknown user"}`,
            });
            const updatedPost = await adminService.deleteCommunityComment(postId, comment.id);
            setPosts((prev) => prev.map((item) => (item.id === postId ? updatedPost : item)));
            setSelectedPost(updatedPost);
            setModerationReason("");
        } catch (err) {
            alert(err.message || "Failed to delete comment.");
        } finally {
            setDeletingCommentId("");
        }
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>Loading community posts...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="admin-shell">
                    <h2>{error}</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-shell">
                <div className="admin-section-header">
                    <div>
                        <h1>Community Posts</h1>
                        <p>Review posts, inspect engagement, and remove content when moderation is needed.</p>
                    </div>

                    <button className="admin-refresh-btn" onClick={loadPosts}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="admin-users-filters">
                    <div className="admin-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by id, author, title, content, tags, or user id"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select value={authorTypeFilter} onChange={(e) => setAuthorTypeFilter(e.target.value)}>
                        <option value="">All Author Types</option>
                        <option value="USER">USER</option>
                        <option value="BUSINESS">BUSINESS</option>
                        <option value="NGO">NGO</option>
                    </select>

                    <select value={tabFilter} onChange={(e) => setTabFilter(e.target.value)}>
                        <option value="">All Tabs</option>
                        <option value="COMMUNITY">COMMUNITY</option>
                        <option value="BROWSE">BROWSE</option>
                        <option value="NGO_HUB">NGO_HUB</option>
                    </select>

                    <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
                        <option value="">All Visibility</option>
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="FOLLOWING_ONLY">FOLLOWING_ONLY</option>
                    </select>
                </div>

                <div className="admin-listings-grid">
                    <div className="admin-listings-table-panel">
                        <div className="admin-users-table-wrap">
                            <table className="admin-users-table">
                                <thead>
                                <tr>
                                    <th>Post</th>
                                    <th>Author Type</th>
                                    <th>Tab</th>
                                    <th>Visibility</th>
                                    <th>Engagement</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredPosts.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="admin-empty-row">
                                            No community posts found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPosts.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="admin-community-post-cell">
                                                    <div className="admin-community-post-thumb">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.title || "Community post"} />
                                                        ) : (
                                                            <MessageSquareText size={18} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <strong>{item.title || "Untitled post"}</strong>
                                                        <p>{item.authorDisplayName || item.authorUsername || item.userId || "Unknown author"}</p>
                                                        <span>{item.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.authorType || "-"}</td>
                                            <td>{item.tab || "-"}</td>
                                            <td>{item.visibility || "-"}</td>
                                            <td>
                                                <div className="admin-community-engagement">
                                                    <span>{item.likeCount ?? 0} likes</span>
                                                    <span>{countItems(item.comments)} comments</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button className="admin-btn" onClick={() => selectPost(item)}>
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="admin-listing-detail-panel">
                        {selectedPost ? (
                            <>
                                <div className="admin-detail-header">
                                    <h2>{selectedPost.title || "Community Post"}</h2>
                                    <button className="admin-btn" onClick={() => { setSelectedPost(null); setModerationReason(""); }}>
                                        Close
                                    </button>
                                </div>

                                {selectedPost.imageUrl ? (
                                    <div className="admin-detail-image-wrap">
                                        <img src={selectedPost.imageUrl} alt={selectedPost.title || "Community post"} />
                                    </div>
                                ) : null}

                                <div className="admin-detail-grid">
                                    <DetailItem label="Post ID" value={selectedPost.id} />
                                    <DetailItem label="User ID" value={selectedPost.userId} />
                                    <DetailItem label="Author" value={selectedPost.authorDisplayName || selectedPost.authorUsername} />
                                    <DetailItem label="Author Type" value={selectedPost.authorType} />
                                    <DetailItem label="Tab" value={selectedPost.tab} />
                                    <DetailItem label="Visibility" value={selectedPost.visibility} />
                                    <DetailItem label="Created" value={formatDate(selectedPost.createdAt)} />
                                    <DetailItem label="Updated" value={formatDate(selectedPost.updatedAt)} />
                                </div>

                                <DetailItem label="Author Headline" value={selectedPost.authorHeadline} block />
                                <DetailItem label="Content" value={selectedPost.content} block />

                                <div className="admin-detail-group">
                                    <label>Tags</label>
                                    <div className="admin-roles-wrap">
                                        {countItems(selectedPost.tags) > 0 ? (
                                            selectedPost.tags.map((tag) => (
                                                <span key={tag} className="admin-role-pill">{tag}</span>
                                            ))
                                        ) : (
                                            <p>-</p>
                                        )}
                                    </div>
                                </div>

                                <div className="admin-detail-grid">
                                    <DetailItem label="Likes" value={selectedPost.likeCount ?? 0} />
                                    <DetailItem label="Dislikes" value={selectedPost.dislikeCount ?? 0} />
                                    <DetailItem label="Comments" value={countItems(selectedPost.comments)} />
                                    <DetailItem label="Reactions" value={countItems(selectedPost.reactions)} />
                                </div>

                                <div className="admin-detail-group">
                                    <label>Recent Comments</label>
                                    {countItems(selectedPost.comments) > 0 ? (
                                        <div className="admin-community-thread">
                                            {selectedPost.comments.map((comment) => (
                                                <div key={comment.id} className="admin-community-thread-item">
                                                    <strong>{comment.displayName || comment.username || comment.userId || "Unknown user"}</strong>
                                                    <p>{comment.text || "-"}</p>
                                                    <span>{formatDate(comment.createdAt)}</span>
                                                    <div className="admin-actions">
                                                        <button
                                                            className="admin-btn admin-btn-danger"
                                                            type="button"
                                                            onClick={() => deleteComment(selectedPost.id, comment)}
                                                            disabled={deletingCommentId === comment.id}
                                                        >
                                                            {deletingCommentId === comment.id ? "Deleting..." : "Delete Comment"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="admin-inline-note">No comments on this post.</p>
                                    )}
                                </div>

                                <div className="admin-review-box">
                                    <div className="admin-verification-review-box">
                                        <label>Moderation Action</label>
                                        <div className="admin-role-management-note">
                                            Deleting the post removes it platform-wide. Provide a reason so the moderation action is logged.
                                        </div>
                                        <textarea
                                            rows="4"
                                            placeholder="Reason for deleting this post"
                                            value={moderationReason}
                                            onChange={(e) => setModerationReason(e.target.value)}
                                        />
                                        <div className="admin-actions">
                                            <button
                                                className="admin-btn admin-btn-danger"
                                                onClick={() => deletePost(selectedPost)}
                                                disabled={deletingId === selectedPost.id}
                                            >
                                                {deletingId === selectedPost.id ? "Deleting..." : "Delete Post"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="admin-empty-detail">
                                <MessageSquareText size={28} />
                                <h3>Select a community post</h3>
                                <p>Choose a post from the table to inspect it and take moderation action.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value, block = false }) {
    return (
        <div className="admin-detail-group" style={block ? undefined : null}>
            <label>{label}</label>
            <p>{value ?? "-"}</p>
        </div>
    );
}
