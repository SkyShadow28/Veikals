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

    // Modal Elements
    const cartModalOverlay = document.getElementById('cartModalOverlay');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const modalCartTotal = document.getElementById('modalCartTotal');
    const cartIcon = document.querySelector('.cart-icon');
    const closeModalBtn = document.querySelector('.close-modal');
    const continueShoppingBtn = document.querySelector('.close-modal-btn');
    const checkoutBtn = document.querySelector('.checkout-btn');

    // Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('valorProCart')) || [];

    function updateCartUI() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        cartCountElement.textContent = totalCount;
        cartTotalElement.textContent = totalPrice.toFixed(2) + '€';

        // Also update modal if open
        if (cartModalOverlay.classList.contains('open')) {
            renderCartModal();
        }
    }

    function saveCart() {
        localStorage.setItem('valorProCart', JSON.stringify(cart));
        updateCartUI();
    }

    function showNotification(message) {
        const container = document.getElementById('toast-container');
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

    // --- Modal Logic ---
    function openModal(e) {
        e.preventDefault();
        renderCartModal();
        cartModalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeModal() {
        cartModalOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function renderCartModal() {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Jūsu grozs ir tukšs.</p>';
            modalCartTotal.textContent = '0.00€';
            return;
        }

        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <span class="cart-item-title">${item.title}</span>
                    <span class="cart-item-details">${item.quantity} x ${item.price.toFixed(2)}€</span>
                </div>
                <div class="cart-item-total">${itemTotal.toFixed(2)}€</div>
                <button class="remove-item" data-index="${index}">&times;</button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        modalCartTotal.textContent = total.toFixed(2) + '€';

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

    // Event Listeners
    cartIcon.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    continueShoppingBtn.addEventListener('click', closeModal);

    cartModalOverlay.addEventListener('click', (e) => {
        if (e.target === cartModalOverlay) {
            closeModal();
        }
    });

    checkoutBtn.addEventListener('click', () => {
        closeModal();
        showNotification('Paldies! Pasūtījums noformēts (simulācija).');
        // Optional: Clear cart
        // cart = [];
        // saveCart();
    });

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const id = button.getAttribute('data-id');
            const title = button.getAttribute('data-title');
            const price = parseFloat(button.getAttribute('data-price'));

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
