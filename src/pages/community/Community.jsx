import React, { useMemo, useState } from "react";
import "./Community.css";

const MOCK_FOLLOWING = [
  { id: "u1", name: "Chelsay223", role: "Farmer", status: "online" },
  { id: "u2", name: "Lamberjack3321", role: "User", status: "offline" },
  { id: "u3", name: "John’s Farm", role: "Business", status: "online" },
  { id: "u4", name: "cookieLover3322521", role: "User", status: "offline" },
  { id: "u5", name: "CoolBoy3211132", role: "Farmer", status: "online" },
  { id: "u6", name: "Pizza Nova", role: "Restaurant", status: "offline" },
  { id: "u7", name: "DogLover23", role: "User", status: "offline" },
  { id: "u8", name: "Theologist23", role: "Farmer", status: "online" },
];

const MOCK_POSTS = [
  {
    id: "p1",
    author: "heyILoveCake",
    time: "4hr",
    following: false,
    imageUrl:
      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=900&q=80",
    likes: 4898,
    caption: "Hey Guys, we just launched some new dishes. Please come and support us :)",
    comments: [
      { id: "c1", user: "itschelsea.williams", time: "9hr", text: "oh my gosh !!!!!" },
      { id: "c2", user: "cheesecakelol", time: "3d", text: "LITERALLY SCREAMINGGGGGGGGGG, IM GONNA RUNNNNN THERE RN !!" },
    ],
  },
  {
    id: "p2",
    author: "heyILoveCake",
    time: "1d",
    following: true,
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
    likes: 4898,
    caption: "COME AND GRAB IT WHILE IT’S HOT!",
    comments: [
      { id: "c3", user: "itschelsea.williams", time: "2d", text: "Sounds awesomeeee!!!!" },
      { id: "c4", user: "jessicaLovesItHeree", time: "2d", text: "I went there last night. The food was soooooo food. Me and my friends had an amazing time !! 10/10" },
    ],
  },
];

function Avatar({ seed }) {
  const initial = (seed || "?").trim().charAt(0).toUpperCase();
  return <div className="c-avatar">{initial}</div>;
}

function formatLikes(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} likes`;
  return `${n} likes`;
}

const Community = () => {
  const [query, setQuery] = useState("");

  const filteredFollowing = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_FOLLOWING;
    return MOCK_FOLLOWING.filter((x) => x.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="community-wrapper">
      <div className="community-container">
        {/* LEFT: Following */}
        <aside className="community-left">
          <div className="left-header">
            <div>
              <div className="left-title">Who you follow</div>
              <div className="left-subtitle">Private</div>
            </div>

            <input
              className="left-search"
              placeholder="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="follow-list">
            {filteredFollowing.map((u) => (
              <div key={u.id} className="follow-row">
                <div className="follow-avatar">
                  <Avatar seed={u.name} />
                </div>

                <div className="follow-meta">
                  <div className="follow-name">{u.name}</div>
                  <div className="follow-role">{u.role}</div>
                </div>

                <div className={`follow-dot ${u.status}`} />
              </div>
            ))}
          </div>

          <button className="left-seeall">See all</button>
        </aside>

        {/* RIGHT: Feed */}
        <main className="community-feed">
          {MOCK_POSTS.map((post) => (
            <article key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-user">
                  <Avatar seed={post.author} />
                  <div className="post-user-meta">
                    <div className="post-author">{post.author}</div>
                    <div className="post-time">{post.time}</div>
                  </div>
                </div>

                <button className="post-follow-btn">
                  {post.following ? "Following" : "Follow"}
                </button>
              </div>

              <div className="post-body">
                <div className="post-image">
                  <img src={post.imageUrl} alt="post" />
                </div>

                <div className="post-comments">
                  {post.comments.map((c) => (
                    <div key={c.id} className="comment-row">
                      <div className="comment-user">
                        <Avatar seed={c.user} />
                      </div>

                      <div className="comment-content">
                        <div className="comment-top">
                          <span className="comment-name">{c.user}</span>
                          <span className="comment-time">{c.time}</span>
                        </div>
                        <div className="comment-text">{c.text}</div>
                        <div className="comment-actions">
                          <button className="comment-link">Like</button>
                          <button className="comment-link">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="post-footer">
                <div className="post-likes">{formatLikes(post.likes)}</div>
                <div className="post-caption">{post.caption}</div>
              </div>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
};

export default Community;