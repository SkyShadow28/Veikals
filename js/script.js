// Main script for Valor Pro website

document.addEventListener('DOMContentLoaded', () => {
    console.log('Valor Pro website loaded');

    // --- Inventory Data (Simulated) ---
    const inventory = [
        { id: 'pluto', available: true },
        { id: 'granberg', available: false },
        { id: 'stepo', available: true },
        { id: 'jaka', available: true }
    ];

    // --- Initialize Availability Indicators ---
    function initAvailability() {
        inventory.forEach(item => {
            const dot = document.querySelector(`.status-dot[data-id="${item.id}"]`);
            if (dot) {
                if (item.available) {
                    dot.classList.add('status-available');
                    dot.setAttribute('data-tooltip', 'Pieejams');
                } else {
                    dot.classList.add('status-unavailable');
                    dot.setAttribute('data-tooltip', 'Nav pieejams');
                }
            }
        });
    }

    initAvailability();

    // --- Cart Functionality ---
    const cartCountElement = document.querySelector('.cart-count');
    const cartTotalElement = document.querySelector('.cart-total');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    // New Modal Elements
    const cartIcon = document.getElementById("cart-icon");
    const cartModal = document.getElementById("cart-modal");
    const closeCart = document.getElementById("close-cart");
    const cartItemsContainer = document.getElementById("cart-items");
    const checkoutBtn = document.getElementById("checkout-btn");

    // Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('valorProCart')) || [];

    function updateCartUI() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (cartCountElement) cartCountElement.textContent = totalCount;
        if (cartTotalElement) cartTotalElement.textContent = totalPrice.toFixed(2) + '€';

        // Also update modal if open
        if (cartModal.style.display === 'flex') {
            renderCartModal();
        }
    }

    function saveCart() {
        localStorage.setItem('valorProCart', JSON.stringify(cart));
        updateCartUI();
    }

    function showNotification(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<i class="fas fa-check-circle" style="color: #2ECC71;"></i> ${message}`;

        container.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // --- Modal Logic (Requested Implementation) ---

    // Open modal
    if (cartIcon) {
        cartIcon.addEventListener("click", (e) => {
            if (e) e.preventDefault();
            renderCartModal();
            cartModal.style.display = "flex";
            document.body.classList.add("no-scroll");
        });
    }

    // Close modal
    if (closeCart) {
        closeCart.addEventListener("click", () => {
            cartModal.style.display = "none";
            document.body.classList.remove("no-scroll");
        });
    }

    // Click outside modal to close
    if (cartModal) {
        cartModal.addEventListener("click", (e) => {
            if (e.target === cartModal) {
                cartModal.style.display = "none";
                document.body.classList.remove("no-scroll");
            }
        });
    }

    function renderCartModal() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Jūsu grozs ir tukšs.</p>';
            return;
        }

        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            // Simple styling for items inside the new structure
            itemElement.style.display = 'flex';
            itemElement.style.justifyContent = 'space-between';
            itemElement.style.alignItems = 'center';
            itemElement.style.padding = '10px 0';
            itemElement.style.borderBottom = '1px solid #eee';

            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <div style="font-weight:bold;">${item.title}</div>
                    <div style="font-size:0.9em; color:#666;">${item.quantity} x ${item.price.toFixed(2)}€</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="cart-item-total" style="font-weight:bold;">${itemTotal.toFixed(2)}€</div>
                    <button class="remove-item" data-index="${index}" style="background:none; border:none; color:red; cursor:pointer; font-size:1.2em;">&times;</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        // Append Total
        const totalElement = document.createElement('div');
        totalElement.style.marginTop = '15px';
        totalElement.style.textAlign = 'right';
        totalElement.style.fontSize = '1.2em';
        totalElement.style.fontWeight = 'bold';
        totalElement.innerHTML = `Kopā: ${total.toFixed(2)}€`;
        cartItemsContainer.appendChild(totalElement);

        // Add event listeners to remove buttons
        const removeButtons = cartItemsContainer.querySelectorAll('.remove-item');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                removeFromCart(index);
            });
        });
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        saveCart();
        renderCartModal(); // Re-render immediately
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            cartModal.style.display = "none";
            document.body.classList.remove("no-scroll");
            showNotification('Paldies! Pasūtījums noformēts (simulācija).');
        });
    }

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Use dataset or getAttribute
            const id = button.getAttribute('data-id') || button.dataset.id;
            const title = button.getAttribute('data-title') || button.dataset.title;
            const price = parseFloat(button.getAttribute('data-price') || button.dataset.price);

            // Check availability
            const itemInInventory = inventory.find(i => i.id === id);
            if (itemInInventory && !itemInInventory.available) {
                showNotification('Atvainojiet, šī prece nav pieejama.');
                return;
            }

            // Add to cart logic
            const existingItem = cart.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    id: id,
                    title: title,
                    price: price,
                    quantity: 1
                });
            }

            saveCart();
            showNotification('Pievienots grozam!');

            // Button feedback
            const originalText = button.textContent;
            button.textContent = 'Pievienots!';
            button.style.backgroundColor = '#2ECC71'; // Green feedback

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = ''; // Revert to CSS style
            }, 1000);
        });
    });

    // Initial UI update
    updateCartUI();
});
