export const FARM_PRODUCT_CATEGORIES = [
    "Vegetables",
    "Fruits",
    "Berries",
    "Herbs",
    "Leafy Greens",
    "Root Vegetables",
    "Mushrooms",
    "Legumes",
    "Grains & Flour",
    "Nuts & Seeds",
    "Plant Proteins",
    "Dairy & Eggs",
    "Meat",
    "Meat & Poultry",
    "Fish",
    "Seafood",
    "Honey & Preserves",
    "Baked Goods",
    "Flowers & Plants",
    "Pantry Staples",
];

export const SURPLUS_FOOD_CATEGORIES = [
    "Prepared Meals",
    "Bakery & Pastries",
    "Fresh Produce",
    "Dairy & Refrigerated",
    "Protein Meals",
    "Meat & Poultry",
    "Fish & Seafood",
    "Packaged Meals",
    "Pantry Goods",
    "Frozen Food",
    "Beverages",
    "Snacks",
    "Desserts",
    "Catering Surplus",
    "Mixed Food Boxes",
];

export const BROWSE_CATEGORY_GROUPS = {
    "Farm Fresh": ["vegetables", "fruits", "berries", "herbs", "leafy greens", "root vegetables", "mushrooms", "legumes"],
    "Bakery & Pantry": ["baked goods", "honey & preserves", "pantry staples", "grains & flour", "nuts & seeds", "pantry goods", "packaged meals"],
    "Protein & Dairy": ["plant proteins", "dairy & eggs", "meat", "meat & poultry", "fish", "seafood", "fish & seafood", "dairy & refrigerated", "protein meals"],
    "Ready to Eat": ["prepared meals", "bakery & pastries", "frozen food", "desserts", "snacks", "beverages", "catering surplus", "mixed food boxes"],
    Donations: ["fresh produce", "prepared meals", "bakery & pastries", "pantry goods", "packaged meals", "protein meals", "meat & poultry", "fish & seafood", "frozen food", "beverages", "snacks", "desserts", "catering surplus", "mixed food boxes"],
};

export const BROWSE_CATEGORY_OPTIONS = [
    ...FARM_PRODUCT_CATEGORIES,
    ...SURPLUS_FOOD_CATEGORIES,
];
