import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PreferencesChips from "./PreferencesChips";
import RatingsReviews from "./RatingsReviews";
import { reviewService } from "@/services/reviewService";
import { followService } from "@/services/follow.service";

function StatBox({ value, label, privacy, isVisible = true, onClick }) {
    if (!isVisible) return null;
    return (
        <div
            className="statBox"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default', transition: 'opacity 0.2s' }}
            onMouseOver={(e) => onClick && (e.currentTarget.style.opacity = '0.7')}
            onMouseOut={(e) => onClick && (e.currentTarget.style.opacity = '1')}
        >
            <div className="statValue">{value}</div>
            <div className="statLabel" style={{ textDecoration: onClick ? 'underline' : 'none' }}>{label}</div>
            <div className="statPrivacy">{privacy}</div>
        </div>
    );
}

export default function UserProfileRight({ profile, isOwnProfile }) {
    const navigate = useNavigate();
    const [writtenReviews, setWrittenReviews] = useState([]);
    const [buyerRating, setBuyerRating] = useState({ averageRating: 0, totalReviews: 0 });
    const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
    const [loading, setLoading] = useState(true);

    const userId = profile?.userId || profile?.id || localStorage.getItem('userId');
    const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || profile?.username;

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const [history, avgData, fStats] = await Promise.all([
                    reviewService.getReviewsByReviewer(userId),
                    reviewService.getAverageRating("BUYER", userId),
                    followService.getStats(userId).catch(() => ({ followers: 0, following: 0 }))
                ]);
                setWrittenReviews(history);
                setBuyerRating(avgData);
                setFollowStats(fStats);
            } catch (err) {
                console.error("Failed to load user data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [userId]);

    const stats = profile?.stats || {};

    const formattedRatings = writtenReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        text: r.comment,
        reviewedAt: new Date(r.createdAt).toLocaleDateString(),
        itemName: r.targetType === "LISTING" ? "Reviewed a Product" : "Reviewed a Business",
        reviewerId: userId,
        reviewerName: "You"
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#4a7c59', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', overflow: 'hidden' }}>
                    {profile?.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt={fullName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    ) : (
                        fullName?.charAt(0).toUpperCase()
                    )}
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>{fullName}</h2>
                    <p style={{ margin: 0, color: '#666' }}>{profile?.role || "Shopper"}</p>
                </div>
            </div>

            <div className="card statsCard">
                <div className="statsHeader">Statistics</div>
                <div className="statsRow">
                    <StatBox label="reviews written" value={writtenReviews.length} privacy="Public" />
                    <StatBox label="purchases" value={stats.purchases ?? 0} privacy="Public" />
                    <StatBox
                        label="following"
                        value={followStats.following}
                        privacy="Public"
                        onClick={isOwnProfile ? () => navigate('/connections') : undefined}
                    />
                    <StatBox
                        label="buyer rating"
                        value={`${buyerRating.averageRating.toFixed(1)} ★`}
                        privacy="Public"
                    />
                    <StatBox
                        label="followers"
                        value={followStats.followers}
                        privacy="Private"
                        isVisible={isOwnProfile}
                        onClick={() => navigate('/connections')}
                    />
                </div>
            </div>

            {loading ? <p style={{textAlign: 'center'}}>Loading history...</p> : <RatingsReviews fullName={fullName} ratings={formattedRatings} />}
        </div>
    );
}