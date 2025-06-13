import { getCurrentUser } from './auth.js';
import { getElement } from './utils.js';
import { submitReview } from './reviews.js';

// API base URL
const API_URL = 'http://localhost:3000';

// Load product details and reviews
async function loadProductDetails() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    const productDetails = getElement('#product-details');
    const reviewList = getElement('#review-list');
    const reviewForm = getElement('#review-form');
    
    try {
        // Fetch product details
        const productResponse = await fetch(`${API_URL}/products/${productId}`);
        if (!productResponse.ok) throw new Error('Failed to load product details');
        const product = await productResponse.json();
        
        // Display product details
        productDetails.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h2>${product.name}</h2>
                <p class="product-description">${product.description}</p>
                <p class="product-price">Price: $${product.price.toFixed(2)}</p>
                <p>Category: ${product.category}</p>
                <p>Stock: ${product.stock} available</p>
                <div class="product-actions">
                    <button id="add-to-cart-btn" class="btn">Add to Cart</button>
                </div>
            </div>
        `;
        
        // Add to cart functionality
        const addToCartBtn = getElement('#add-to-cart-btn');
        addToCartBtn.addEventListener('click', () => {
            const user = getCurrentUser();
            if (!user || user.role !== 'customer') {
                alert('Please log in as a customer to add to cart');
                window.location.href = 'login.html';
                return;
            }
            addToCart(user.id, product.id);
            alert('Item added to cart!');
        });
        
        // Load reviews for this product
        await loadProductReviews(productId, reviewList);
        
        // Setup review form for logged-in customers who have purchased the product
        setupReviewForm(productId, product.name, reviewForm, reviewList);
        
    } catch (error) {
        console.error('Product details error:', error.message);
        productDetails.innerHTML = '<p>Sorry, could not load product details.</p>';
    }
}

// Load reviews for a specific product
async function loadProductReviews(productId, container) {
    try {
        // Fetch reviews for this product
        const reviewsResponse = await fetch(`${API_URL}/reviews?productId=${productId}`);
        if (!reviewsResponse.ok) throw new Error('Failed to load reviews');
        const reviews = await reviewsResponse.json();
        
        // Fetch users to get usernames
        const usersResponse = await fetch(`${API_URL}/users`);
        if (!usersResponse.ok) throw new Error('Failed to load users');
        const users = await usersResponse.json();
        
        // Display reviews or "no reviews" message
        if (reviews.length === 0) {
            container.innerHTML = '<p>No reviews for this product yet.</p>';
        } else {
            container.innerHTML = '';
            
            for (const review of reviews) {
                // Find user and extract name, checking multiple possible properties
                const userObj = users.find(u => u.id === review.userId);
                let userName = 'Anonymous User';
                
                if (userObj) {
                    // Check various possible name properties
                    if (userObj.username) {
                        userName = userObj.username;
                    } else if (userObj.name) {
                        userName = userObj.name;
                    } else if (userObj.fullName) {
                        userName = userObj.fullName;
                    } else if (userObj.displayName) {
                        userName = userObj.displayName;
                    } else if (userObj.firstName) {
                        userName = userObj.firstName + (userObj.lastName ? ' ' + userObj.lastName : '');
                    } else if (userObj.email) {
                        // Use email as last resort, but hide the domain
                        const emailParts = userObj.email.split('@');
                        userName = emailParts[0];
                    }
                }
                
                // Format date properly with fallback
                let formattedDate = 'Unknown date';
                try {
                    if (review.createdAt) {
                        formattedDate = new Date(review.createdAt).toLocaleDateString();
                    }
                } catch (e) {
                    console.error('Date formatting error:', e);
                }
                
                const reviewElement = document.createElement('div');
                reviewElement.className = 'review-item';
                reviewElement.innerHTML = `
                    <div class="review-header">
                        <span class="review-author">${userName}</span>
                        <span class="review-date">${formattedDate}</span>
                        <div class="review-rating">${getStarRating(review.rating)}</div>
                    </div>
                    <div class="review-content">${review.text}</div>
                `;
                
                container.appendChild(reviewElement);
            }
        }
    } catch (error) {
        console.error('Load reviews error:', error.message);
        container.innerHTML = '<p>Sorry, could not load reviews.</p>';
    }
}

// Check if user has purchased the product
async function hasUserPurchasedProduct(userId, productId) {
    try {
        // Fetch user's orders
        const ordersResponse = await fetch(`${API_URL}/orders?userId=${userId}`);
        if (!ordersResponse.ok) throw new Error('Failed to load orders');
        const orders = await ordersResponse.json();
        
        // Check if any completed order contains the product
        for (const order of orders) {
            // Only consider delivered or completed orders
            if (order.status === 'delivered' || order.status === 'completed') {
                // Check if product exists in order items
                const hasProduct = order.items.some(item => String(item.productId) === String(productId));
                if (hasProduct) {
                    return true;
                }
            }
        }
        
        return false;
    } catch (error) {
        console.error('Check purchase error:', error.message);
        return false; // Default to false on error
    }
}

// Setup review form for logged-in customers who have purchased the product
async function setupReviewForm(productId, productName, form, reviewListContainer) {
    const user = getCurrentUser();
    
    // Only allow logged-in customers to proceed
    if (!user || user.role !== 'customer') {
        // Show login message
        form.innerHTML = `
            <div class="form-group">
                <p>Please log in as a customer to leave a review.</p>
                <a href="login.html" class="btn">Login</a>
            </div>
        `;
        return;
    }
    
    // Check if user has purchased the product
    const hasPurchased = await hasUserPurchasedProduct(user.id, productId);
    
    if (!hasPurchased) {
        // Show message that purchase is required
        form.innerHTML = `
            <div class="form-group">
                <p>You need to purchase this product before you can review it.</p>
                <p>Only customers who have bought "${productName}" can leave a review.</p>
            </div>
        `;
        return;
    }
    
    // User has purchased, show review form
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const ratingInput = getElement('#rating');
        const commentInput = getElement('#comment');
        
        const rating = parseInt(ratingInput.value);
        const text = commentInput.value;
        
        if (!rating || !text || rating < 1 || rating > 5) {
            alert('Please provide a rating (1-5) and a comment');
            return;
        }
        
        // Get current user info for the review
        const currentUser = getCurrentUser();
        
        // Create review object with user information
        const review = {
            productId: parseInt(productId),
            userId: currentUser.id,
            // Include username directly in the review if possible
            userName: currentUser.username || currentUser.name || currentUser.fullName || 
                     currentUser.displayName || 'Customer',
            rating,
            text,
            createdAt: new Date().toISOString()
        };
        
        try {
            await submitReview(review);
            form.reset();
            // Reload reviews to show the new one
            await loadProductReviews(productId, reviewListContainer);
            alert('Review submitted successfully!');
        } catch (error) {
            console.error('Submit review error:', error);
            alert('Failed to submit review. Please try again.');
        }
    });
}

// Helper function to generate star rating HTML
function getStarRating(rating) {
    const fullStar = '★';
    const emptyStar = '☆';
    let stars = '';
    
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? fullStar : emptyStar;
    }
    
    return stars;
}

// Add item to the user's cart
function addToCart(userId, productId) {
    try {
        let cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];
        const item = cart.find(item => item.productId === productId);
        if (item) {
            item.quantity += 1;
        } else {
            cart.push({ productId, quantity: 1 });
        }
        localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
        console.log(`Cart updated for user ${userId}:`, cart);
    } catch (error) {
        console.error('Add to cart error:', error.message);
        alert('Failed to add item to cart.');
    }
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', loadProductDetails);
