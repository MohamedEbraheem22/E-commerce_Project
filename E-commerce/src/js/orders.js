import { getCurrentUser, restrictCartAndOrders } from './auth.js';
import { getElement } from './utils.js';

// API base URL
const API_URL = 'http://localhost:3000';

// Format date nicely
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Unknown date';
    }
}

// Get status class for styling
function getStatusClass(status) {
    status = status.toLowerCase();
    return status === 'pending' || status === 'processing' || 
           status === 'shipped' || status === 'delivered' || 
           status === 'cancelled' ? status : 'pending';
}

// Load the user's orders
async function loadOrders() {
    const user = getCurrentUser();
    if (!user || user.role !== 'customer') {
        window.location.href = 'login.html';
        return;
    }

    // Hide cart buttons for admins/sellers
    restrictCartAndOrders();

    const orderList = getElement('#order-list');

    try {
        // Fetch user's orders
        const response = await fetch(`${API_URL}/orders?userId=${user.id}`);
        if (!response.ok) throw new Error('Failed to load orders');
        const orders = await response.json();

        // Fetch all products
        const productsResponse = await fetch(`${API_URL}/products`);
        if (!productsResponse.ok) throw new Error('Failed to load products');
        const products = await productsResponse.json();

        // Display orders
        orderList.innerHTML = '';
        if (orders.length === 0) {
            orderList.innerHTML = '<p>No orders found. Start shopping to see your orders here!</p>';
            return;
        }

        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        for (const order of orders) {
            const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            
            // Create items HTML with product images
            let itemsHTML = '';
            for (const item of order.items) {
                const product = products.find(p => p.id == item.productId);
                if (product) {
                    itemsHTML += `
                        <div class="order-item">
                            <div class="item-image">
                                <img src="${product.image}" alt="${product.name}">
                            </div>
                            <div class="item-details">
                                <p class="item-name">${product.name}</p>
                                <p class="item-quantity">Quantity: ${item.quantity}</p>
                                <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                    `;
                } else {
                    itemsHTML += `
                        <div class="order-item">
                            <div class="item-image">
                                <div class="no-image">No Image</div>
                            </div>
                            <div class="item-details">
                                <p class="item-name">Unknown Product</p>
                                <p class="item-quantity">Quantity: ${item.quantity}</p>
                                <p class="item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        </div>
                    `;
                }
            }

            const statusClass = getStatusClass(order.status);
            const formattedDate = formatDate(order.createdAt);

            orderList.innerHTML += `
                <div class="order-card" data-status="${statusClass}">
                    <h3 data-status="${order.status}">Order #${order.id}</h3>
                    <div class="order-items">
                        ${itemsHTML}
                    </div>
                    <p class="order-total">Total: $${total.toFixed(2)}</p>
                    <p>Status: <span class="status-badge ${statusClass}">${order.status}</span></p>
                    <p class="order-date">Ordered on: ${formattedDate}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Orders error:', error.message);
        orderList.innerHTML = '<p>Sorry, could not load orders. Please try again later.</p>';
    }
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', loadOrders);
