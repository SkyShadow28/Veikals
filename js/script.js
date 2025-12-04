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

    // Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('valorProCart')) || [];

    function updateCartUI() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        cartCountElement.textContent = totalCount;
        cartTotalElement.textContent = totalPrice.toFixed(2) + '€';
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
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

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
