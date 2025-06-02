// =========================================================
// Global Variables and Initial Load
// =========================================================

// Load cart from localStorage - 'bbc_cart' is the key
let cart = JSON.parse(localStorage.getItem('bbc_cart') || '[]');

// Cart-related DOM elements (ensure these IDs exist in your HTML)
const toggleBtn = document.getElementById('cartToggle');
const badge = document.getElementById('cartCount');
const amountEl = document.getElementById('cartAmount'); // For total amount display in cart panel (if applicable)
const panel = document.getElementById('cartPanel');
const itemsEl = document.getElementById('cartItems'); // Where cart items are listed
const totalEl = document.getElementById('cartTotal'); // Total price in cart panel
const addBtn = document.getElementById('addToCart'); // Button to add product to cart
const closeCartBtn = document.querySelector('.close-cart'); // Button to close cart panel

// =========================================================
// Cart Utility Functions
// =========================================================

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('bbc_cart', JSON.stringify(cart));
}

// Generates a unique key for addons to differentiate cart items
function addonsKey(addons) {
    return addons.map(a => `${a.name}:${a.price}`).sort().join('|');
}

// =========================================================
// Cart UI Update Logic
// =========================================================

// Updates the cart UI: displays items, total, and item count
function updateCart() {
    if (!itemsEl) return; // Exit if cart items element is not found

    itemsEl.innerHTML = ''; // Clear existing items
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        itemsEl.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
    } else {
        cart.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'cart-item';

            const main = document.createElement('div');
            main.className = 'item-main';

            const addonTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) || 0;
            const itemTotal = (item.price + addonTotal) * item.qty;

            main.innerHTML = `
                <span>${item.name} ${item.size ? `(${item.size})` : ''} x${item.qty}</span>
                <span>
                    ₱${itemTotal.toFixed(2)}
                    <button class="qty-btn" data-key="${item.key}" data-action="decrease">➖</button>
                    <button class="qty-btn" data-key="${item.key}" data-action="increase">➕</button>
                </span>
            `;

            wrapper.appendChild(main);

            const ul = document.createElement('ul');
            ul.className = 'sub-items';

            // Show size as sub-item if applicable
            if (item.size) {
                const li = document.createElement('li');
                li.textContent = `Size: ${item.size}`;
                ul.appendChild(li);
            }

            // Show add-ons
            if (item.addons?.length) {
                item.addons.forEach(a => {
                    const li = document.createElement('li');
                    li.textContent = `${a.name} (₱${a.price.toFixed(2)})`;
                    ul.appendChild(li);
                });
            }

            if (ul.children.length) {
                wrapper.appendChild(ul);
            }

            itemsEl.appendChild(wrapper);
            total += itemTotal;
            count += item.qty;
        });
    }


    if (totalEl) totalEl.textContent = `Total: ₱${total.toFixed(2)}`;
    if (badge) badge.textContent = count;
    if (amountEl) amountEl.textContent = `₱${total.toFixed(2)}`; // For a separate amount display if badge is just count
    saveCart();
}

// =========================================================
// Add to Cart Functionality (from menu.html)
// =========================================================

function addToCart() {
    const prodInfo = document.querySelector('.product-info');
    if (!prodInfo) {
        console.warn('Product info element not found. Cannot add to cart.');
        return;
    }

    const name = prodInfo.dataset.name;
    // basePrice is no longer directly used for item price, sizePrice handles it
    // const basePrice = parseFloat(prodInfo.dataset.price);
    const qtyInput = document.getElementById('qty');
    const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : '1', 10) || 1);


    const selectedAddons = Array.from(document.querySelectorAll('.addon-checkbox:checked')).map(cb => ({
        name: cb.dataset.name,
        price: parseFloat(cb.dataset.price)
    }));

    const sizeRadio = document.querySelector('input[name="size"]:checked');
    const size = sizeRadio ? sizeRadio.value : null;
    const sizePrice = sizeRadio ? parseFloat(sizeRadio.dataset.price) : parseFloat(prodInfo.dataset.price); // Use base price if no size selected


    // Clear checkboxes after adding
    document.querySelectorAll('.addon-checkbox:checked').forEach(cb => cb.checked = false);
    if(qtyInput) qtyInput.value = 1; // Reset quantity to 1 after adding to cart


    // Generate unique cart key
    const key = `${name}|${size || 'default'}|${addonsKey(selectedAddons)}`;

    // Check for existing item
    const existing = cart.find(i => i.key === key);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ key, name, size, price: sizePrice, qty, addons: selectedAddons });
    }

    updateCart();
    // Optionally open cart panel after adding
    if (panel) panel.classList.add('active');
}

// =========================================================
// Handle Quantity Changes in Cart (from cart panel)
// =========================================================

function handleCartClick(e) {
    const btn = e.target;
    if (btn.classList.contains('qty-btn')) {
        const key = btn.dataset.key;
        const action = btn.dataset.action;
        const item = cart.find(i => i.key === key);

        if (item) {
            if (action === 'increase') {
                item.qty++;
            } else if (action === 'decrease') {
                item.qty--;
                if (item.qty < 1) {
                    cart = cart.filter(i => i.key !== key); // Remove item if quantity goes below 1
                }
            }
            updateCart();
        }
    }
}

// =========================================================
// Event Listeners for Cart and Global UI
// =========================================================

// Cart toggle button
if (toggleBtn) {
    toggleBtn.addEventListener('click', e => {
        e.preventDefault();
        if (panel) panel.classList.toggle('active');
    });
}

// Close cart button
if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
        if (panel) panel.classList.remove('active');
    });
}

// Add to Cart button (from product page)
if (addBtn) addBtn.addEventListener('click', addToCart);

// Event delegation for quantity buttons inside cart
if (itemsEl) itemsEl.addEventListener('click', handleCartClick);

// Initial cart update when the page loads
document.addEventListener('DOMContentLoaded', updateCart);

// =========================================================
// Size Selection and Price Display (for menu.html product view)
// =========================================================

const sizeRadios = document.querySelectorAll('input[name="size"]');
const priceDisplay = document.getElementById('priceDisplay');
const productInfo = document.querySelector('.product-info');

sizeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        const selected = document.querySelector('input[name="size"]:checked');
        if (selected && priceDisplay && productInfo) {
            priceDisplay.textContent = `₱${parseFloat(selected.dataset.price).toFixed(2)}`;
            productInfo.setAttribute('data-price', selected.dataset.price);
            productInfo.setAttribute('data-size', selected.value);
        }
    });
});

// Set initial price display based on default selected size or product base price
document.addEventListener('DOMContentLoaded', () => {
    const defaultSelectedSize = document.querySelector('input[name="size"]:checked');
    if (defaultSelectedSize && priceDisplay && productInfo) {
        priceDisplay.textContent = `₱${parseFloat(defaultSelectedSize.dataset.price).toFixed(2)}`;
        productInfo.setAttribute('data-price', defaultSelectedSize.dataset.price);
        productInfo.setAttribute('data-size', defaultSelectedSize.value);
    } else if (productInfo && priceDisplay && productInfo.dataset.price) {
        // Fallback to initial product-info price if no size is selected by default
        priceDisplay.textContent = `₱${parseFloat(productInfo.dataset.price).toFixed(2)}`;
    }
});


// =========================================================
// Side Navigation (for menu.html, if applicable)
// =========================================================

const toggleButton = document.querySelector('#menuToggle'); // Assuming this toggles a side menu
const sideNav = document.querySelector('.side-nav');

if (toggleButton && sideNav) {
    toggleButton.addEventListener('click', () => {
        sideNav.classList.toggle('active');
    });
}


// =========================================================
// Signup Page Logic (from signup.html)
// =========================================================

// This DOMContentLoaded ensures the signup form logic runs after the page is loaded.
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('.signup-form form');
    const termsCheckbox = document.getElementById('terms');

    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent default form submission

            const email = signupForm.email.value.trim();
            const password = signupForm.password.value;
            const address = signupForm.address.value.trim();
            const phone = signupForm.phone.value.trim();

            const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i; // Added 'i' for case-insensitivity
            const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
            const phonePattern = /^09\d{9}$/;

            // Validate fields
            if (!emailPattern.test(email)) {
                alert("Please enter a valid email address.");
                return;
            }

            if (!passwordPattern.test(password)) {
                alert("Password must include at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.");
                return;
            }

            if (address.length < 5) {
                alert("Please enter a valid address (at least 5 characters).");
                return;
            }

            if (!phonePattern.test(phone)) {
                alert("Enter a valid 11-digit Philippine mobile number starting with '09'.");
                return;
            }

            if (!termsCheckbox || !termsCheckbox.checked) { // Check if checkbox exists and is checked
                alert("You must agree to the Terms and Conditions.");
                return;
            }

            // If all validations pass
            alert("Signup successful! Welcome to BellyBelles ☕");
            signupForm.reset(); // Clear the form
            // Optionally redirect to login page: window.location.href = 'login.html';
        });
    }
});


// =========================================================
// Login Page Logic (from login.html)
// =========================================================

// This DOMContentLoaded ensures the login form logic runs after the page is loaded.
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form form');
    if (!loginForm) return; // Exit if login form is not found

    const emailInput = loginForm.email;
    const passwordInput = loginForm.password;
    const rememberCheckbox = loginForm.querySelector('#remember');

    // Load saved credentials if 'Remember me' was checked before
    if (localStorage.getItem('rememberMe') === 'true') {
        emailInput.value = localStorage.getItem('email') || '';
        passwordInput.value = localStorage.getItem('password') || '';
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent the form from submitting

        // Save credentials if 'Remember me' is checked
        if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('email', emailInput.value);
            localStorage.setItem('password', passwordInput.value);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('email');
            localStorage.removeItem('password');
        }

        // --- AUTHENTICATION LOGIC GOES HERE ---
        // In a real application, you would send emailInput.value and passwordInput.value
        // to your backend for authentication.
        // For this example, we'll just show an alert.

        // Example simple client-side validation (for demonstration only)
        if (emailInput.value === "test@example.com" && passwordInput.value === "Password123!") {
             alert("Login Successful! (This is a demo login)");
             // window.location.href = 'index.html'; // Redirect on successful login
        } else {
             alert("Invalid email or password.");
        }
    });
});


// =========================================================
// Checkout Page Logic (from checkout.html)
// =========================================================

// Elements for payment method selection
const gcashRadio = document.querySelector('input[value="gcash"]');
const codRadio = document.querySelector('input[value="cod"]');
const gcashDetails = document.getElementById('gcashDetails');
const checkoutConfirmBtn = document.getElementById('checkoutConfirmBtn'); // Assuming you have a button with this ID

// Event listener for payment method radios to show/hide GCash details
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (gcashDetails) {
            gcashDetails.style.display = gcashRadio && gcashRadio.checked ? 'block' : 'none';
        }
    });
});

// Function to handle payment submission from checkout
function submitPayment() {
    const selected = document.querySelector('input[name="payment"]:checked');

    if (!selected) {
        alert("Please select a payment method.");
        return;
    }

    // Save the selected payment method to localStorage for the review page
    localStorage.setItem('selectedPayment', selected.value === "gcash" ? "GCash" : "Cash on Delivery");

    if (selected.value === "gcash") {
        alert("Please complete the payment via GCash and confirm.");
        // In a real application, you'd integrate with a payment gateway here.
        // For this demo, we'll simulate "payment" and redirect to the review page.
        window.location.href = 'review.html';
    } else {
        alert("Your order has been placed with Cash on Delivery.");
        window.location.href = 'review.html';
    }
}

// Add event listener to the checkout confirm button
if (checkoutConfirmBtn) {
    checkoutConfirmBtn.addEventListener('click', submitPayment);
}


// Function to display the order summary on the checkout page
function displayOrderSummary() {
    const orderDetailsEl = document.getElementById('orderDetails'); // Used in checkout AND review
    const checkoutTotalEl = document.getElementById('orderTotalAmount'); // Specific to checkout total

    if (!orderDetailsEl || !checkoutTotalEl) return; // Exit if elements are not found

    let currentCart = JSON.parse(localStorage.getItem('bbc_cart') || '[]');
    let total = 0;
    orderDetailsEl.innerHTML = ''; // Clear previous order details

    if (currentCart.length === 0) {
        orderDetailsEl.innerHTML = '<p>No items in your cart to checkout.</p>';
    } else {
        currentCart.forEach(item => {
            const addonTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) || 0;
            const itemTotal = (item.price + addonTotal) * item.qty;
            total += itemTotal;
            const itemDetails = document.createElement('p');
            itemDetails.textContent = `${item.name} ${item.size ? `(${item.size})` : ''} x${item.qty} - ₱${itemTotal.toFixed(2)}`;
            orderDetailsEl.appendChild(itemDetails);

            // Also display addons here for clarity
            if (item.addons?.length) {
                const ul = document.createElement('ul');
                ul.style.fontSize = '0.9em'; // Smaller text for addons
                ul.style.marginLeft = '15px';
                item.addons.forEach(a => {
                    const li = document.createElement('li');
                    li.textContent = `${a.name} (₱${a.price.toFixed(2)})`;
                    ul.appendChild(li);
                });
                orderDetailsEl.appendChild(ul);
            }
        });
    }

    checkoutTotalEl.textContent = `${total.toFixed(2)}`;
}

// Call displayOrderSummary when the checkout page loads
document.addEventListener('DOMContentLoaded', displayOrderSummary);


// =========================================================
// Review Page Logic (from review.html)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    const paymentMethodEl = document.getElementById('paymentMethod');
    const orderDetailsDiv = document.getElementById('orderDetails'); // Same ID as checkout, be careful with CSS
    const reviewTotalEl = document.getElementById('reviewTotalAmount'); // Element for total on review page
    const confirmOrderBtn = document.getElementById('confirmOrder'); // Button to finalize and go home

    // Retrieve the selected payment method from local storage
    const paymentMethod = localStorage.getItem('selectedPayment');
    if (paymentMethodEl && paymentMethod) {
        paymentMethodEl.textContent = paymentMethod;
    } else if (paymentMethodEl) {
        paymentMethodEl.textContent = 'Not selected'; // Default if not found
    }

    // Retrieve order details from local storage (the cart)
    const orderDetails = JSON.parse(localStorage.getItem('bbc_cart') || '[]');
    let totalOrderAmount = 0;

    if (orderDetailsDiv) { // Check if the orderDetailsDiv exists on this page
        orderDetailsDiv.innerHTML = ''; // Clear existing content

        if (orderDetails.length > 0) {
            orderDetails.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'review-item-summary'; // Add a class for styling if needed

                const addonTotal = item.addons?.reduce((sum, a) => sum + a.price, 0) || 0;
                const itemCalculatedPrice = (item.price + addonTotal) * item.qty;
                totalOrderAmount += itemCalculatedPrice;

                itemDiv.innerHTML = `
                    <span>${item.name} ${item.size ? `(${item.size})` : ''} x ${item.qty}</span>
                    <span>₱${itemCalculatedPrice.toFixed(2)}</span>
                `;

                // Display add-ons if any
                if (item.addons?.length) {
                    const addonsList = document.createElement('ul');
                    addonsList.className = 'review-addons-list';
                    item.addons.forEach(addon => {
                        const li = document.createElement('li');
                        li.textContent = `${addon.name} (₱${addon.price.toFixed(2)})`;
                        addonsList.appendChild(li);
                    });
                    itemDiv.appendChild(addonsList);
                }

                orderDetailsDiv.appendChild(itemDiv);
            });
        } else {
            orderDetailsDiv.textContent = 'No items in the order.';
        }
    }


    // Display the total amount on the review page
    if (reviewTotalEl) {
        reviewTotalEl.textContent = `₱${totalOrderAmount.toFixed(2)}`;
    }

    // Event listener for the "Confirm Order" button on the review page
    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener('click', function() {
            // Clear the cart and selected payment method from local storage
            localStorage.removeItem('bbc_cart');
            localStorage.removeItem('selectedPayment');
            // Redirect to the index page
            window.location.href = 'index.html';
        });
    }
});