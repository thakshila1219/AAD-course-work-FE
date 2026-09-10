# 🍽️ Restaurant Management System — Frontend (Client Application)

Welcome to the **Frontend Repository** of the Restaurant Management System! This is a modern, responsive single/multi-page web interface built for managing restaurant operations, seamless food ordering, and user administration. It communicates with a RESTful Spring Boot backend to deliver a fast and reliable user experience.

---

## 🌟 Key Features

### 👤 Customer Portal
* 🔐 **Authentication & Authorization**: Secure signup, login, and session persistence using Local/Session Storage.
* 🍔 **Interactive Food Menu**: Browse available dishes dynamically, view prices, categories, and item availability.
* 🛒 **Smart Shopping Cart**: Add/remove items, adjust quantities, and calculate real-time totals before checkout.
* 📦 **Order Placement**: Place single or multi-item food orders with custom delivery addresses.
* 📜 **Order History & Status Tracking**: Track order progress (e.g., Pending, Preparing, Completed) in real-time.

### 🛡️ Admin Management Portal
* 📊 **Executive Dashboard**: High-level visual summary of system metrics, active orders, and revenue insights.
* 🥗 **Menu Management (CRUD)**: Easily add new dishes, update pricing, upload images, or mark items as out of stock.
* 🚚 **Order Fulfillment System**: View incoming customer orders, change order states, and approve/reject transactions.
* 👥 **User Administration**: Manage customer accounts, review registration details, and handle user permissions.

---

## 🛠️ Tech Stack & Architecture

* **Markup Language**: HTML5 (Semantic elements)
* **Styling**: CSS3 (Flexbox, CSS Grid, Custom Variables, Animations)
* **Scripting Language**: Vanilla JavaScript (ES6+ Asynchronous Fetch API, Promises, DOM Manipulation)
* **Version Control**: Git & GitHub

---

## 📂 Project Directory Structure
aad_project/
├── 📁 assets/                 # Static media resources (Images, Logos, Backgrounds)
│   ├── Dashboard.jpg
│   ├── login.png
│   └── NormalPage.jpg
├── 📁 css/                    # Modular Style Sheets
│   ├── auth.css               # Authentication & form layouts
│   └── style.css              # Main application themes & component styles
├── 📁 js/                     # Client-side Business Logic
│   ├── admin_dashboard.js     # Admin control panel operations
│   ├── auth.js                # Auth guards & token handlers
│   ├── customer.js            # Menu fetching & cart logic
│   ├── login.js               # Login API integration
│   ├── main.js                # Common navigation & global handlers
│   └── signup.js              # User registration workflows
├── 📄 admin_dashbord.html     # Administrator Management Console
├── 📄 customer-dashboard.html # Customer Interface & Ordering Screen
├── 📄 user_dashbord.html     # User Profile & History Dashboard
├── 📄 login.html              # Secure User Authentication Entry
└── 📄 signup.html             # New Account Registration Portal

## 🚀 Setup & Local Deployment

Follow these simple steps to run the frontend application on your local machine:

### Prerequisites
* A modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Brave)
* Visual Studio Code (Recommended IDE)
* **Live Server** extension installed in VS Code

### Step-by-Step Installation

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/thakshila1219/AAD-course-work-FE.git](https://github.com/thakshila1219/AAD-course-work-FE.git)
