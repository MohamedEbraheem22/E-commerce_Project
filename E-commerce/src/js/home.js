import { getCurrentUser, restrictCartAndOrders } from './auth.js';
import { getElement } from './utils.js';

// API base URL
const API_URL = 'http://localhost:3000';

// Load categories and best-sellers on the home page
async function loadHome() {
    const categoryList = getElement('#category-list');
    const bestSellerList = getElement('#best-seller-list');

    // Hide cart buttons for admins/sellers
    restrictCartAndOrders();

    try {
        // Fetch categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) throw new Error('Failed to load categories');
        const categories = await categoriesResponse.json();

        // Fetch approved products
        const productsResponse = await fetch(`${API_URL}/products?status=approved`);
        if (!productsResponse.ok) throw new Error('Failed to load products');
        const products = await productsResponse.json();

        // Pick top 3 products by stock as best-sellers
        const bestSellers = products.sort((a, b) => b.stock - a.stock).slice(0, 3);

        // Display categories
        categoryList.innerHTML = '';
        for (const category of categories) {
            categoryList.innerHTML += `
                <div class="category-card">
                    <img src="${category.image}" alt="${category.name}">
                    <h3>${category.name}</h3>
                    <a href="products.html?category=${category.name}" class="btn">Shop Now</a>
                </div>
            `;
        }

        // Display best-sellers
        bestSellerList.innerHTML = '';
        const user = getCurrentUser();
        for (const product of bestSellers) {
            bestSellerList.innerHTML += `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>Price: $${product.price.toFixed(2)}</p>
                    <a href="product-details.html?id=${product.id}" class="btn">View Details</a>
                    ${user && user.role === 'customer' ? 
                        `<button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                </div>
            `;
        }

        // Handle add-to-cart clicks
        bestSellerList.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-cart')) {
                event.preventDefault();
                const user = getCurrentUser();
                if (!user || user.role !== 'customer') {
                    alert('Please log in as a customer to add to cart');
                    window.location.href = 'login.html';
                    return;
                }
                const productId = parseInt(event.target.dataset.productId);
                console.log(`Adding product ${productId} to cart for user ${user.id}`);
                addToCart(user.id, productId);
                alert('Item added to cart!');
            }
        });
    } catch (error) {
        console.error('Home page error:', error.message);
        categoryList.innerHTML = '<p>Sorry, could not load categories.</p>';
        bestSellerList.innerHTML = '<p>Sorry, could not load best sellers.</p>';
    }
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
document.addEventListener('DOMContentLoaded', loadHome);