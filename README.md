E-Commerce Platform
A fully functional e-commerce platform built with vanilla JavaScript, HTML, and CSS, using JSON Server as a mock backend. This project showcases a modern, responsive web application with product browsing, cart management, user authentication, and role-based dashboards for admins and sellers. Ideal for learning web development or prototyping an e-commerce solution.
Repository: github.com/Algorithm-Archetict/E-Commerce
Table of Contents

Features
Project Structure
Setup
Usage
Contributing
License

Features

Product Browsing: Explore products by category, search with filters, and view best-sellers based on sales count.
Interactive Categories: Filter products using visually appealing category cards with images.
Cart Management: Add/remove items, update quantities, and persist cart across sessions.
User Authentication: Register/login as a customer, seller, or admin with role-based access.
Dashboards:
Admin: Manage users, products, orders, and reviews.
Seller: Add/edit/delete products and track orders.


Product Reviews: Customers can submit reviews for purchased products.
Responsive UI: Mobile-first design with a modern aesthetic, inspired by leading e-commerce platforms.
Mock Backend: JSON Server provides a RESTful API, storing data in db.json.

Project Structure
E-Commerce/
├── db.json                   # Mock backend data (products, users, orders, reviews, categories)
├── src/
│   ├── pages/                # HTML pages (home, products, cart, dashboard, etc.)
│   ├── css/                  # Modular CSS files (base, colors, typography, etc.)
│   ├── js/                   # JavaScript modules (auth, products, cart, etc.)
│   ├── assets/
│   │   ├── images/           # Logo and placeholder images
│   │   └── fonts/            # Custom fonts (if any)
├── package.json              # Node.js dependencies and scripts
├── README.md                 # Project documentation
└── .gitignore                # Excludes node_modules, logs, etc.

Setup
Follow these steps to run the project locally on Windows or other systems.
Prerequisites

Node.js (v14 or higher)
Git for cloning the repository
A modern web browser (Chrome, Firefox, etc.)
Optional: VS Code or another code editor

Installation

Clone the Repository:
git clone https://github.com/Algorithm-Archetict/E-Commerce.git
cd E-Commerce


Install Dependencies:Install JSON Server and other dependencies:
npm install


Start JSON Server:Run the mock backend to serve db.json on http://localhost:3000:
npm start


Serve the Frontend:Use a local HTTP server to serve static files:
npm install -g http-server
cd src
http-server -p 8080


Access the Application:Open your browser and navigate to http://localhost:8080/pages/home.html.


Notes

Ensure db.json is writable for JSON Server to handle POST, PUT, PATCH, and DELETE requests.
On Windows, use Git Bash for commands, or adjust paths for Command Prompt/PowerShell (e.g., cd E:\path\to\E-Commerce).
If CORS issues occur, verify JSON Server is running on http://localhost:3000.

Usage

Home Page: Browse products, filter by category, and view best-sellers.
Products Page: Search products, view details, and add items to the cart (requires customer login).
Cart: Manage items, update quantities, and checkout (requires login).
Login/Register: Create an account (customer, seller, or admin) or log in to access profile/dashboard.
Dashboards:
Admin: Approve products, manage users, orders, and reviews.
Seller: Add/edit/delete products and view orders.


Profile: Update username and password.
Product Details: View product info, submit reviews (if purchased), and manage products (admin/seller).

Testing API Endpoints
Use Postman or browser DevTools to test:

GET /products: List approved products.
POST /users: Register a new user.
POST /orders: Place an order.
POST /reviews: Submit a review.

Contributing
We welcome contributions to enhance the platform! To contribute:

Fork the Repository:Click "Fork" on github.com/Algorithm-Archetict/E-Commerce.

Create a Branch:
git checkout -b feature/your-feature-name


Make Changes:

Follow the existing code style (2-space indentation, no inline event handlers).
Test CRUD operations to ensure db.json updates correctly.
Update README.md for new features.


Commit and Push:
git commit -m "Add your feature description"
git push origin feature/your-feature-name


Submit a Pull Request:Open a pull request with a clear description of your changes.


Guidelines

Keep code modular and maintainable.
Test all changes locally, including API operations.
Use descriptive commit messages.
Adhere to the MIT license.
