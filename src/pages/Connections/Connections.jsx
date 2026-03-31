import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { followService } from '@/services/follow.service';
import { ChevronLeft } from 'lucide-react';

const Connections = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Following');
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', targetUser: null });

    const currentUserId = localStorage.getItem('userId');

    // Fetch data from your actual backend
    const loadConnections = useCallback(async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            const [followersData, followingData] = await Promise.all([
                followService.getFollowers(currentUserId),
                followService.getFollowing(currentUserId)
            ]);
            setFollowers(followersData);
            setFollowing(followingData);
        } catch (error) {
            console.error("Failed to load connections:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        loadConnections().catch(console.error);
    }, [loadConnections]);

    // Handle button clicks (Direct actions vs Modal triggers)
    const handleActionClick = async (type, targetUser) => {
        if (type === 'Unfollow') {
            await followService.unfollowUser(targetUser.id);
            await  loadConnections(); // Refresh list
        } else if (type === 'Follow back') {
            await followService.followUser(targetUser.id);
           await loadConnections(); // Refresh list
        } else {
            // 'Block' and 'Remove' open the warning modal
            setModalConfig({ isOpen: true, type, targetUser });
        }
    };

    // Confirm destructive actions from the modal
    const confirmAction = async () => {
        const { type, targetUser } = modalConfig;
        setModalConfig({ ...modalConfig, isOpen: false }); // Close modal immediately

        try {
            if (type === 'Block') {
                await followService.blockUser(targetUser.id);
            } else if (type === 'Remove') {
                await followService.removeFollower(targetUser.id);
            }
            await loadConnections(); // Refresh list after backend confirms
        } catch (error) {
            alert(`Failed to ${type.toLowerCase()} user.`);
        }
    };

    // Helper for rendering the Avatar (handles missing images)
    const renderAvatar = (user) => (
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#fff', border: '2px solid #D1CBB8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden', color: '#6D804B', fontWeight: 'bold' }}>
            {user.avatarUrl ? <img src={user.avatarUrl} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : user.displayName?.charAt(0).toUpperCase()}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F2E8', fontFamily: 'serif', paddingBottom: '40px' }}>

            {/* Header Area */}
            <div style={{ backgroundColor: '#6D804B', color: 'white', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <button onClick={() => navigate(-1)} style={{ position: 'absolute', left: '40px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>
                    <ChevronLeft /> Back
                </button>
                <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: '2px' }}>CONNECTIONS</h1>
            </div>

            <div style={{ maxWidth: '900px', margin: '40px auto', backgroundColor: '#EBE7D9', padding: '25px', borderRadius: '16px', border: '1px solid #D1CBB8', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>

                {/* Tabs */}
                <div style={{ display: 'flex', marginBottom: '25px' }}>
                    <button
                        onClick={() => setActiveTab('Following')}
                        style={{ flex: 1, padding: '12px 25px', border: '1px solid #D1CBB8', borderRadius: '12px 0 0 12px', background: activeTab === 'Following' ? '#F5F2E8' : '#EBE7D9', fontWeight: activeTab === 'Following' ? 'bold' : 'normal', cursor: 'pointer', color: '#3B422D', fontSize: '1.1rem' }}
                    >
                        Following ({following.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('Followers')}
                        style={{ flex: 1, padding: '12px 25px', border: '1px solid #D1CBB8', borderLeft: 'none', borderRadius: '0 12px 12px 0', background: activeTab === 'Followers' ? '#F5F2E8' : '#EBE7D9', fontWeight: activeTab === 'Followers' ? 'bold' : 'normal', cursor: 'pointer', color: '#3B422D', fontSize: '1.1rem' }}
                    >
                        Followers ({followers.length})
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6D804B' }}>Loading connections...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {(activeTab === 'Following' ? following : followers).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No {activeTab.toLowerCase()} found.</div>
                        ) : (
                            (activeTab === 'Following' ? following : followers).map((conn) => (
                                <div key={conn.followId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F2E8', padding: '15px 25px', borderRadius: '12px', border: '1px solid #D1CBB8' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${conn.user.id}`)}>
                                        {renderAvatar(conn.user)}
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#3B422D', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {conn.user.displayName} <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6D804B', display: 'inline-block' }}></span>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>{conn.user.role}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {activeTab === 'Following' ? (
                                            <>
                                                <button onClick={() => handleActionClick('Unfollow', conn.user)} style={{ backgroundColor: '#7B8B5B', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>Unfollow</button>
                                                <button onClick={() => handleActionClick('Block', conn.user)} style={{ backgroundColor: '#A73A3A', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Block</button>
                                            </>
                                        ) : (
                                            <>
                                                {!conn.mutual && (
                                                    <button onClick={() => handleActionClick('Follow back', conn.user)} style={{ backgroundColor: '#7B8B5B', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Follow back</button>
                                                )}
                                                <button onClick={() => handleActionClick('Remove', conn.user)} style={{ backgroundColor: '#A73A3A', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Remove</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL */}
            {modalConfig.isOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ backgroundColor: '#EBE7D9', padding: '30px', borderRadius: '20px', border: '1px solid #D1CBB8', boxShadow: '0 15px 30px rgba(0,0,0,0.2)', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#3B422D', fontSize: '1.5rem' }}>{modalConfig.type} user?</h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', backgroundColor: '#F5F2E8', padding: '15px', borderRadius: '12px' }}>
                            {renderAvatar(modalConfig.targetUser)}
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#3B422D' }}>{modalConfig.targetUser.displayName}</div>
                                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>We won't notify them about this action.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={confirmAction} style={{ flex: 1, backgroundColor: '#A73A3A', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                {modalConfig.type}
                            </button>
                            <button onClick={() => setModalConfig({ isOpen: false, type: '', targetUser: null })} style={{ flex: 1, backgroundColor: '#7B8B5B', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Connections;