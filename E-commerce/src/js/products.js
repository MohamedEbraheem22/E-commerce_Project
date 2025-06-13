import { getCurrentUser, restrictCartAndOrders } from './auth.js';
import { getElement } from './utils.js';

// API base URL and pagination settings
const API_URL = 'http://localhost:3000';
const PRODUCTS_PER_PAGE = 8;

// Load products with pagination, search, and category filter
async function loadProducts() {
    const productList = getElement('#product-list');
    const categoryFilter = getElement('#category-filter');
    const searchInput = getElement('#search-input');
    const prevPageBtn = getElement('#prev-page');
    const nextPageBtn = getElement('#next-page');
    const pageNumbers = getElement('#page-numbers');

    // Hide cart buttons for admins/sellers
    restrictCartAndOrders();

    let currentPage = 1;
    let allProducts = [];
    let filteredProducts = [];

    try {
        // Fetch all approved products
        const productsResponse = await fetch(`${API_URL}/products?status=approved`);
        if (!productsResponse.ok) throw new Error('Failed to load products');
        allProducts = await productsResponse.json();

        // Fetch categories for the filter dropdown
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) throw new Error('Failed to load categories');
        const categories = await categoriesResponse.json();

        // Populate category filter
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        for (const category of categories) {
            categoryFilter.innerHTML += `<option value="${category.name}">${category.name}</option>`;
        }

        // Show initial products
        filteredProducts = allProducts;
        showProducts(filteredProducts, currentPage);

        // Update products when category changes
        categoryFilter.addEventListener('change', () => {
            currentPage = 1;
            updateFilteredProducts();
        });

        // Update products when search input changes
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            updateFilteredProducts();
        });

        // Go to previous page
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                showProducts(filteredProducts, currentPage);
            }
        });

        // Go to next page
        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                showProducts(filteredProducts, currentPage);
            }
        });

        // Go to specific page
        pageNumbers.addEventListener('click', (event) => {
            if (event.target.classList.contains('page-number')) {
                currentPage = parseInt(event.target.dataset.page);
                showProducts(filteredProducts, currentPage);
            }
        });

        // Handle add-to-cart clicks
        productList.addEventListener('click', (event) => {
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

        // Filter products based on search and category
        function updateFilteredProducts() {
            const category = categoryFilter.value;
            const search = searchInput.value.toLowerCase();
            filteredProducts = allProducts.filter(product => {
                const matchesCategory = !category || product.category === category;
                const matchesSearch = product.name.toLowerCase().includes(search);
                return matchesCategory && matchesSearch;
            });
            showProducts(filteredProducts, currentPage);
        }
    } catch (error) {
        console.error('Products page error:', error.message);
        productList.innerHTML = '<p>Sorry, could not load products.</p>';
    }

    // Display products for the current page
    function showProducts(products, page) {
        const start = (page - 1) * PRODUCTS_PER_PAGE;
        const end = start + PRODUCTS_PER_PAGE;
        const productsToShow = products.slice(start, end);

        // Show products
        productList.innerHTML = '';
        const user = getCurrentUser();
        for (const product of productsToShow) {
            productList.innerHTML += `
                <div class="product-card">
                    <img src="${product.image}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>Price: $${product.price.toFixed(2)}</p>
                    <p>Stock: ${product.stock}</p>
                    <a href="product-details.html?id=${product.id}" class="btn">View Details</a>
                    ${user && user.role === 'customer' ? 
                        `<button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                </div>
            `;
        }

        // Update pagination controls
        const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
        prevPageBtn.disabled = page === 1;
        nextPageBtn.disabled = page === totalPages;

        pageNumbers.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.innerHTML += `
                <button class="btn page-number ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>
            `;
        }
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
document.addEventListener('DOMContentLoaded', loadProducts);