import { getCurrentUser, restrictCartAndOrders } from "./auth.js";
import { getElement } from "./utils.js";

// API base URL
const API_URL = "http://localhost:3000";

// Load the user's cart
async function loadCart() {
  const user = getCurrentUser();
  if (!user || user.role !== "customer") {
    window.location.href = "login.html";
    return;
  }

  // Hide checkout button for non-customers
  restrictCartAndOrders();
  const userId = String(user.id);

  const cartItems = JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];

  const cartContainer = getElement("#cart-items");
  const totalItemsEl = getElement("#total-items");

  const totalPriceEl = getElement("#total-price");

  if (cartItems.length == 0) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    totalItemsEl.textContent = "0";
    totalPriceEl.textContent = "0.00";
    return;
  }

  try {
    // Fetch all products
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error("Failed to load products");
    const products = await response.json();

    // Display cart items
    cartContainer.innerHTML = "";
    let totalItems = 0;
    let totalPrice = 0;

    for (const item of cartItems) {
      const product = products.find((p) => p.id == item.productId);
      if (product) {
        cartContainer.innerHTML += `
                    <div class="cart-item">
                        <img src="${product.image}" alt="${product.name}">
                        <div>
                            <h3>${product.name}</h3>
                            <p>Price: $${product.price.toFixed(2)}</p>
                            <p>Quantity: <input type="number" class="quantity" data-product-id="${
                              product.id
                            }" value="${item.quantity}" min="1"></p>
                            <button class="btn remove-item" data-product-id="${
                              product.id
                            }">Remove</button>
                        </div>
                    </div>
                `;
        totalItems += item.quantity;
        totalPrice += product.price * item.quantity;
      }
    }

    // Update order summary
    totalItemsEl.textContent = totalItems;
    totalPriceEl.textContent = totalPrice.toFixed(2);

    // Handle quantity changes
    cartContainer.addEventListener("change", async (event) => {
      if (event.target.classList.contains("quantity")) {
        const productId = parseInt(event.target.dataset.productId);
        const quantity = parseInt(event.target.value);
        
          updateCartItem(user.id, productId, quantity);
          await loadCart();
        
      }
    });

    // Handle remove item
    cartContainer.addEventListener("click", async (event) => {
      if (event.target.classList.contains("remove-item")) {
        const productId = parseInt(event.target.dataset.productId);
        if (confirm("Remove item from cart?")) {
          removeCartItem(user.id, productId);
          await loadCart();
        }
      }
    });

    // Handle checkout
    const checkoutBtn = getElement("#checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", async () => {
        if (cartItems.length == 0) {
          alert("Your cart is empty!");
          return;
        }
        if (confirm(`Confirm checkout? Total: $${totalPrice.toFixed(2)}`)) {
          await checkout(user.id, cartItems);
          localStorage.removeItem(`cart_${user.id}`);
          alert("Order placed successfully!");
          window.location.href = "orders.html";
        }
      });
    }
  } catch (error) {
    console.error("Cart error:", error.message);
    cartContainer.innerHTML = "<p>Sorry, could not load cart.</p>";
  }
}

// Update item quantity in cart
function updateCartItem(userId, productId, quantity) {
  try {
    let cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];
    const itemIndex = cart.findIndex((item) => item.productId == productId);
    if (itemIndex != -1) {
      if (quantity > 0) {
        cart[itemIndex].quantity = quantity;
      } else {
        cart.splice(itemIndex, 1);
      }
    }
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    console.log(`Cart updated for user ${userId}:`, cart);
  } catch (error) {
    console.error("Update cart error:", error.message);
    alert("Failed to update cart.");
  }
}

// Remove item from cart
function removeCartItem(userId, productId) {
  try {
    let cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];
    cart = cart.filter((item) => item.productId != productId);
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    console.log(`Cart updated for user ${userId}:`, cart);
  } catch (error) {
    console.error("Remove cart item error:", error.message);
    alert("Failed to remove item from cart.");
  }
}

// Create an order on checkout
async function checkout(userId, cartItems) {
  try {
    const productsResponse = await fetch(`${API_URL}/products`);
    if (!productsResponse.ok) throw new Error("Failed to load products");
    const products = await productsResponse.json();

    const order = {
      userId,
      items: cartItems.map((item) => {
        const product = products.find((p) => p.id == item.productId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product ? product.price : 0,
        };
      }),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error("Checkout failed");
  } catch (error) {
    console.error("Checkout error:", error.message);
    alert("Checkout failed. Please try again.");
  }
}

// Run when the page loads
document.addEventListener("DOMContentLoaded", loadCart);
