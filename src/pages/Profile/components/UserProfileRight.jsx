import React, { useState, useEffect } from 'react';
import PreferencesChips from "./PreferencesChips";
import RatingsReviews from "./RatingsReviews";
import { reviewService } from "@/services/reviewService"; // IMPORT API

function StatBox({ value, label, privacy }) {
    return (
        <div className="statBox">
            <div className="statValue">{value}</div>
            <div className="statLabel">{label}</div>
            <div className="statPrivacy">{privacy}</div>
        </div>
    );
}

export default function UserProfileRight({ profile }) {
    // 1. New State for Reviews & Ratings
    const [writtenReviews, setWrittenReviews] = useState([]);
    const [buyerRating, setBuyerRating] = useState({ averageRating: 0, totalReviews: 0 });
    const [loading, setLoading] = useState(true);

    // We fallback to localStorage if profile.userId isn't passed directly
    const userId = profile?.userId || profile?.id || localStorage.getItem('userId');

    useEffect(() => {
        const fetchUserReviews = async () => {
            if (!userId) return;
            try {
                setLoading(true);

                // Fetch the reviews this user has WRITTEN
                const history = await reviewService.getReviewsByReviewer(userId);

                // Fetch the rating OF this user (if sellers rated them as a BUYER)
                const avgData = await reviewService.getAverageRating("BUYER", userId);

                setWrittenReviews(history);
                setBuyerRating(avgData);
            } catch (err) {
                console.error("Failed to load user reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserReviews();
    }, [userId]);

    const stats = profile?.stats || {};
    const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();

    // 2. Format backend data so your existing <RatingsReviews /> component can read it
    const formattedRatings = writtenReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        text: r.comment,
        reviewedAt: new Date(r.createdAt).toLocaleDateString(),
        // Label it based on what they reviewed
        itemName: r.targetType === "LISTING" ? "Reviewed a Product" : "Reviewed a Business",
    }));

    return (
        <>
            <PreferencesChips preferences={profile?.preferences || []} />

            <div className="card statsCard">
                <div className="statsHeader">Statistics</div>

                <div className="statsRow">
                    {/* DYNAMIC: How many reviews they've written */}
                    <StatBox label="reviews written" value={writtenReviews.length} privacy="Public" />

                    <StatBox label="purchases" value={stats.purchases ?? 0} privacy="Public" />
                    <StatBox label="following" value={stats.following ?? 0} privacy="Public" />

                    {/* DYNAMIC: Their rating as a Buyer/Citizen */}
                    <StatBox
                        label="buyer rating"
                        value={`${buyerRating.averageRating > 0 ? buyerRating.averageRating.toFixed(1) : "0.0"} ★`}
                        privacy="Public"
                    />

                    <StatBox label="followers" value={stats.followers ?? 0} privacy="Private" />
                </div>
            </div>

            {/* 3. Pass the formatted reviews to the display component */}
            {loading ? (
                <div className="card reviewsCard">
                    <div className="p-6 text-center text-gray-500">Loading review history...</div>
                </div>
            ) : (
                <RatingsReviews fullName={fullName} ratings={formattedRatings} />
            )}
        </>
    );
}