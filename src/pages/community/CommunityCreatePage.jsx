import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { communityService } from "../../services/community.service";
import { profileService } from "../../services/profile.service";
import CommunityComposerForm from "./CommunityComposerForm";
import "./Community.css";

function deriveAuthorType(profile) {
  const businessType = String(profile?.businessProfile?.businessType || "").toUpperCase();
  if (businessType === "NGO") return "NGO";
  if (businessType === "FARMER" || businessType === "RESTAURANT") return "BUSINESS";
  return "USER";
}

function deriveAuthorHeadline(profile) {
  if (profile?.businessProfile?.businessName) return profile.businessProfile.businessName;
  if (profile?.personalProfile?.displayName) return profile.personalProfile.displayName;
  return null;
}

export default function CommunityCreatePage() {
  const navigate = useNavigate();
  const currentUserId = authService.getUserId();

  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await profileService.getMe();
        if (!cancelled) setMe(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load your profile.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (values) => {
    if (!currentUserId) {
      setError("You need to log in before creating a post.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const created = await communityService.createPost({
        userId: currentUserId,
        title: values.title,
        content: values.content,
        imageUrl: values.imageUrl || null,
        tags: values.tags,
        visibility: values.visibility,
        tab: "COMMUNITY",
        authorType: deriveAuthorType(me),
        authorHeadline: deriveAuthorHeadline(me),
      });
      navigate(`/community/posts/${created.id}`);
    } catch (e) {
      setError(e.message || "Failed to create the post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="community-page-shell">
      <div className="community-page community-page--narrow">
        <div className="community-page-header">
          <div>
            <h1 className="community-page-title">Create a post</h1>
            <p className="community-page-subtitle">Upload a photo from your computer, add tags, and publish to Community.</p>
          </div>
          <Link to="/community" className="community-secondary-btn community-link-btn">Back to feed</Link>
        </div>

        <div className="community-panel-card">
          <CommunityComposerForm submitLabel="Post" busy={busy} error={error} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
