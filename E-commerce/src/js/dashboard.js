import { getCurrentUser, restrictCartAndOrders } from "./auth.js";
import { getElement } from "./utils.js";

// API base URL
const API_URL = "http://localhost:3000";

// Helper function for API calls with retry
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Retry ${i + 1} for ${url}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Toggle section visibility
function toggleSections(sectionId) {
  const sections = document.querySelectorAll("main section");
  const links = document.querySelectorAll("#dashboard-links a");

  // Hide all sections and remove active class from links
  sections.forEach((section) => section.classList.add("hidden"));
  links.forEach((link) => link.classList.remove("active"));

  // Show the selected section and mark its link as active
  const targetSection = document.getElementById(sectionId);
  const targetLink = document.querySelector(
    `#dashboard-links a[data-section="${sectionId}"]`
  );
  if (targetSection && targetLink) {
    targetSection.classList.remove("hidden");
    targetLink.classList.add("active");
  }
}

// Load dashboard content
async function loadDashboard() {
  const user = getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    console.warn("Unauthorized access to dashboard");
    window.location.href = "login.html";
    return;
  }

  console.log("Loading dashboard for user:", user);
  restrictCartAndOrders();

  const kpiList = getElement("#kpi-list");
  const productForm = getElement("#product-form");
  const productTable = getElement("#product-table tbody");
  const orderTable = getElement("#order-table tbody");
  const reviewTable = getElement("#review-table tbody");
  const categorySelect = getElement("#product-category");

  try {
    // Fetch data
    const [
      productsResponse,
      ordersResponse,
      reviewsResponse,
      categoriesResponse,
      usersResponse,
    ] = await Promise.all([
      fetchWithRetry(
        user.role === "admin"
          ? `${API_URL}/products`
          : `${API_URL}/products?sellerId=${user.id}`
      ),
      fetchWithRetry(
        user.role === "admin"
          ? `${API_URL}/orders`
          : `${API_URL}/orders?sellerId=${user.id}`
      ),
      fetchWithRetry(
        user.role === "admin"
          ? `${API_URL}/reviews`
          : `${API_URL}/reviews?sellerId=${user.id}`
      ),
      fetchWithRetry(`${API_URL}/categories`),
      fetchWithRetry(`${API_URL}/users`),
    ]);

    const products = await productsResponse.json();
    const orders = await ordersResponse.json();
    const reviews = await reviewsResponse.json();
    const categories = await categoriesResponse.json();
    const users = await usersResponse.json();

    // Log data for debugging
    console.log("Products loaded:", products);
    console.log("Reviews loaded:", reviews);

    // Display KPIs
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce((s, item) => s + item.price * item.quantity, 0),
      0
    );
    kpiList.innerHTML = `
            <div class="kpi-card">
                <h3>Total Products</h3>
                <p>${totalProducts}</p>
            </div>
            <div class="kpi-card">
                <h3>Total Orders</h3>
                <p>${totalOrders}</p>
            </div>
            <div class="kpi-card">
                <h3>Total Revenue</h3>
                <p>$${totalRevenue.toFixed(2)}</p>
            </div>
        `;

    // Populate category dropdown
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    categories.forEach((category) => {
      categorySelect.innerHTML += `<option value="${category.name}">${category.name}</option>`;
    });

    // Display products
    productTable.innerHTML = "";
    products.forEach((product) => {
      productTable.innerHTML += `
                <tr>
                    <td>${product.name}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${product.category}</td>
                    <td>${product.stock}</td>
                    <td>${product.status || "N/A"}</td>
                    <td>
                        <button class="btn edit-product" data-product-id="${
                          product.id
                        }">Edit</button>
                        <button class="btn delete-product" data-product-id="${
                          product.id
                        }">Delete</button>
                        ${
                          user.role === "admin" && product.status === "pending"
                            ? `<button class="btn approve-product" data-product-id="${product.id}">Approve</button>`
                            : ""
                        }
                    </td>
                </tr>
            `;
    });

    // Display orders
    orderTable.innerHTML = "";
    orders.forEach((order) => {
      const customer = users.find((u) => String(u.id) === String(order.userId));
      const total = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      orderTable.innerHTML += `
        <tr>
            <td>${order.id}</td>
            <td>${
              customer
                ? `${customer.firstName} ${customer.lastName}`
                : "Unknown"
            }</td>
            <td>$${total.toFixed(2)}</td>
            <td>
                ${
                  user.role === "seller"
                    ? `<select class="order-status" data-order-id="${order.id}">
                            <option value="pending" ${
                              order.status === "pending" ? "selected" : ""
                            }>Pending</option>
                            <option value="shipped" ${
                              order.status === "shipped" ? "selected" : ""
                            }>Shipped</option>
                            <option value="delivered" ${
                              order.status === "delivered" ? "selected" : ""
                            }>Delivered</option>
                        </select>`
                    : `<span>${order.status}</span>`
                }
            </td>
            <td>
                <button class="btn delete-order" data-order-id="${
                  order.id
                }">Delete</button>
            </td>
        </tr>
    `;
    });

    // Display reviews
    reviewTable.innerHTML = "";
    reviews.forEach((review) => {
      // Fix: Use string comparison for IDs to handle both string and number types
      const product = products.find(
        (p) => String(p.id) === String(review.productId)
      );
      const customer = users.find(
        (u) => String(u.id) === String(review.userId)
      );

      // For debugging
      if (!product) {
        console.log("Product not found for review:", review);
        console.log(
          "Review productId:",
          review.productId,
          "type:",
          typeof review.productId
        );
        console.log(
          "Available product IDs:",
          products.map((p) => ({ id: p.id, type: typeof p.id }))
        );
      }

      reviewTable.innerHTML += `
                <tr>
                    <td>${product ? product.name : "Unknown"}</td>
                    <td>${
                      customer
                        ? `${customer.firstName} ${customer.lastName}`
                        : "Unknown"
                    }</td>
                    <td>${review.rating}</td>
                    <td>${review.comment || review.text || ""}</td>
                    <td>
                        <button class="btn delete-review" data-review-id="${
                          review.id
                        }">Delete</button>
                    </td>
                </tr>
            `;
    });

    // Handle product form submission
    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const productId = getElement("#product-id").value;
      const product = {
        name: getElement("#product-name").value.trim(),
        price: parseFloat(getElement("#product-price").value),
        category: getElement("#product-category").value,
        image: getElement("#product-image").value.trim(),
        stock: parseInt(getElement("#product-stock").value),
        description: getElement("#product-description").value.trim(),
        sellerId: user.id,
        status: user.role === "admin" ? "approved" : "pending",
      };

      if (
        !product.name ||
        !product.price ||
        !product.category ||
        !product.image ||
        !product.stock ||
        !product.description
      ) {
        alert("Please fill in all fields");
        return;
      }

      try {
        const url = productId
          ? `${API_URL}/products/${productId}`
          : `${API_URL}/products`;
        const method = productId ? "PUT" : "POST";
        await fetchWithRetry(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        });
        alert(productId ? "Product updated!" : "Product added!");
        productForm.reset();
        getElement("#product-id").value = "";
        await loadDashboard();
      } catch (error) {
        console.error("Product save error:", error.message);
        alert("Failed to save product");
      }
    });

    // Handle dynamic button clicks with event delegation
    document.addEventListener("click", async (event) => {
      const target = event.target;
      const productId = target.dataset.productId;
      const orderId = target.dataset.orderId;
      const reviewId = target.dataset.reviewId;

      if (target.classList.contains("edit-product")) {
        // Fix: Use string comparison for IDs
        const product = products.find(
          (p) => String(p.id) === String(productId)
        );
        if (product) {
          getElement("#product-id").value = product.id;
          getElement("#product-name").value = product.name;
          getElement("#product-price").value = product.price;
          getElement("#product-category").value = product.category;
          getElement("#product-image").value = product.image;
          getElement("#product-stock").value = product.stock;
          getElement("#product-description").value = product.description;
        }
      } else if (target.classList.contains("delete-product")) {
        if (confirm("Delete this product?")) {
          try {
            await fetchWithRetry(`${API_URL}/products/${productId}`, {
              method: "DELETE",
            });
            alert("Product deleted!");
            await loadDashboard();
          } catch (error) {
            console.error("Delete product error:", error.message);
            alert("Failed to delete product");
          }
        }
      } else if (target.classList.contains("approve-product")) {
        if (confirm("Approve this product?")) {
          try {
            await fetchWithRetry(`${API_URL}/products/${productId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "approved" }),
            });
            alert("Product approved!");
            await loadDashboard();
          } catch (error) {
            console.error("Approve product error:", error.message);
            alert("Failed to approve product");
          }
        }
      } else if (target.classList.contains("delete-order")) {
        if (confirm("Delete this order?")) {
          try {
            await fetchWithRetry(`${API_URL}/orders/${orderId}`, {
              method: "DELETE",
            });
            alert("Order deleted!");
            await loadDashboard();
          } catch (error) {
            console.error("Delete order error:", error.message);
            alert("Failed to delete order");
          }
        }
      } else if (target.classList.contains("delete-review")) {
        if (confirm("Delete this review?")) {
          try {
            await fetchWithRetry(`${API_URL}/reviews/${reviewId}`, {
              method: "DELETE",
            });
            alert("Review deleted!");
            await loadDashboard();
          } catch (error) {
            console.error("Delete review error:", error.message);
            alert("Failed to delete review");
          }
        }
      }
    });

    // Handle order status changes
    document.addEventListener("change", async (event) => {
      if (event.target.classList.contains("order-status")) {
        const orderId = event.target.dataset.orderId;
        const status = event.target.value;
        if (confirm(`Update order status to ${status}?`)) {
          try {
            await fetchWithRetry(`${API_URL}/orders/${orderId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
            alert("Order status updated!");
            await loadDashboard();
          } catch (error) {
            console.error("Update order status error:", error.message);
            alert("Failed to update order status");
          }
        }
      }
    });

    // Show KPIs by default after data loads
    toggleSections("kpi-section");
  } catch (error) {
    console.error("Dashboard load error:", error.message);
    kpiList.innerHTML = "<p>Sorry, could not load dashboard.</p>";
  }
}

// Set up dashboard link listeners
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();

  // Add click listeners to dashboard links
  const dashboardLinks = document.querySelectorAll("#dashboard-links a");
  dashboardLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sectionId = link.getAttribute("data-section");
      console.log(`Switching to section: ${sectionId}`);
      toggleSections(sectionId);
    });
  });
});
