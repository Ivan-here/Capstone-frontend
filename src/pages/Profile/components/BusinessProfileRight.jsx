export default function BusinessProfileRight({ businessProfile }) {
    const verified = businessProfile?.verified;

    // placeholder “documents” section (like your mock)
    const docStatus = verified ? "Verified" : "Pending verification";

    // placeholder “products” section (for later)
    const products = businessProfile?.products || []; // optional future

    return (
        <>
            <div className="card businessDocsCard">
                <div className="sectionTitle">Documents</div>

                <div className="businessDocRow">
                    <div className="businessDocTitle">Food Safety Certificate:</div>
                    <div className="businessDocMeta">
                        <div>Status: <b>{docStatus}</b></div>
                        <div className="muted">Expires: —</div>
                        <div className="muted">Next verification: —</div>
                        <button className="linkBtn" type="button">View all documents</button>
                    </div>
                </div>
            </div>

            <div className="card statsCard">
                <div className="statsHeader">Statistics</div>

                <div className="statsRow businessStatsRow">
                    <div className="statBox">
                        <div className="statValue">{businessProfile?.reviews ?? 0}</div>
                        <div className="statLabel">reviews</div>
                    </div>

                    <div className="statBox">
                        <div className="statValue">{businessProfile?.purchases ?? 0}</div>
                        <div className="statLabel">purchases</div>
                    </div>

                    <div className="statBox">
                        <div className="statValue">{businessProfile?.totalSales ?? 0}</div>
                        <div className="statLabel">total sales</div>
                    </div>

                    <div className="statBox">
                        <div className="statValue">
                            {(businessProfile?.avgRating ?? 0).toFixed(1)} ★
                        </div>
                        <div className="statLabel">average rating</div>
                    </div>
                </div>
            </div>

            <div className="card businessProductsCard">
                <div className="sectionTitle">Products</div>

                {products.length === 0 ? (
                    <div className="muted">No products yet.</div>
                ) : (
                    <div className="productGrid">
                        {products.map((p) => (
                            <div key={p.id} className="productCard">
                                <div className="productImg" aria-hidden="true">🛒</div>

                                <div className="productInfo">
                                    <div className="productName">{p.name}</div>
                                    <div className="productMeta">
                                        <span>{p.rating} ★</span>
                                        <span>{p.price}</span>
                                    </div>
                                    <div className="productDesc">{p.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
