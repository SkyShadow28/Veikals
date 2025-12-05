document.addEventListener('DOMContentLoaded', () => {
    const inventory = [
        { id: 'pluto', available: true },
        { id: 'granberg', available: false },
        { id: 'stepo', available: true },
        { id: 'jaka', available: true }
    ];

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

    const cartCountElement = document.querySelector('.cart-count');
    const cartTotalElement = document.querySelector('.cart-total');
    // Updated selector
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    const cartIcon = document.querySelector('.cart-icon');
    const cartModalOverlay = document.getElementById('cartModalOverlay');
    const cartModal = document.querySelector('.cart-modal');
    const closeCart = document.querySelector('.close-modal');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const checkoutBtn = document.querySelector('.checkout-btn');

    let cart = JSON.parse(localStorage.getItem('valorProCart')) || [];

    function updateCartUI() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (cartCountElement) cartCountElement.textContent = totalCount;
        if (cartTotalElement) cartTotalElement.textContent = totalPrice.toFixed(2) + '€';

        if (cartModalOverlay && cartModalOverlay.style.display === 'flex') {
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

    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            renderCartModal();
            if (cartModalOverlay) {
                cartModalOverlay.style.display = 'flex';
                document.body.classList.add('no-scroll');
            }
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => {
            if (cartModalOverlay) {
                cartModalOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
        });
    }

    if (cartModalOverlay) {
        cartModalOverlay.addEventListener('click', (e) => {
            if (e.target === cartModalOverlay) {
                cartModalOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
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

        const totalElement = document.createElement('div');
        totalElement.style.marginTop = '15px';
        totalElement.style.textAlign = 'right';
        totalElement.style.fontSize = '1.2em';
        totalElement.style.fontWeight = 'bold';
        totalElement.innerHTML = `Kopā: ${total.toFixed(2)}€`;
        cartItemsContainer.appendChild(totalElement);

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
        renderCartModal();
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cartModalOverlay) {
                cartModalOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
            showNotification('Paldies! Pasūtījums noformēts (simulācija).');
        });
    }

    // Direct Add to Cart Buttons (on cards)
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const id = button.getAttribute('data-id') || button.dataset.id;
            const title = button.getAttribute('data-title') || button.dataset.title;
            const price = parseFloat(button.getAttribute('data-price') || button.dataset.price);

            const itemInInventory = inventory.find(i => i.id === id);
            if (itemInInventory && !itemInInventory.available) {
                showNotification('Atvainojiet, šī prece nav pieejama.');
                return;
            }

            const existingItem = cart.find(item => item.id === id && item.title === title);

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

            const originalText = button.textContent;
            button.textContent = 'Pievienots!';
            button.style.backgroundColor = '#2ECC71';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 1000);
        });
    });

    // Product Details Modal Logic
    const productDetailsOverlay = document.getElementById('productDetailsOverlay');
    const closeDetailsModal = document.querySelector('.close-details-modal');
    const modalImage = document.querySelector('.modal-product-image');
    const modalTitle = document.querySelector('.modal-product-title');
    const modalPrice = document.querySelector('.modal-product-price');
    const modalAvailability = document.querySelector('.modal-product-availability');
    const modalDescription = document.querySelector('.modal-product-description');
    const productSizeSelector = document.getElementById('productSizeSelector');
    const modalAddToCartBtn = document.querySelector('.modal-add-to-cart-btn');

    const productDetailsButtons = document.querySelectorAll('.product-details-btn');

    let currentProductDetails = {};

    productDetailsButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const title = btn.getAttribute('data-title');
            const price = btn.getAttribute('data-price');
            const image = btn.getAttribute('data-image');
            const description = btn.getAttribute('data-description');
            const availability = btn.getAttribute('data-availability');

            currentProductDetails = { id, title, price: parseFloat(price) };

            if (modalImage) modalImage.src = image;
            if (modalTitle) modalTitle.textContent = title;
            if (modalPrice) modalPrice.textContent = price + '€';
            if (modalAvailability) modalAvailability.textContent = 'Pieejamība: ' + availability;
            if (modalDescription) modalDescription.textContent = description;

            // Reset size selector and button
            if (productSizeSelector) productSizeSelector.value = "";
            if (modalAddToCartBtn) modalAddToCartBtn.disabled = true;

            if (productDetailsOverlay) {
                productDetailsOverlay.style.display = 'flex';
                document.body.classList.add('no-scroll');
            }
        });
    });

    if (closeDetailsModal) {
        closeDetailsModal.addEventListener('click', () => {
            if (productDetailsOverlay) {
                productDetailsOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
        });
    }

    if (productDetailsOverlay) {
        productDetailsOverlay.addEventListener('click', (e) => {
            if (e.target === productDetailsOverlay) {
                productDetailsOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
        });
    }

    if (productSizeSelector) {
        productSizeSelector.addEventListener('change', () => {
            if (modalAddToCartBtn) {
                if (productSizeSelector.value) {
                    modalAddToCartBtn.disabled = false;
                } else {
                    modalAddToCartBtn.disabled = true;
                }
            }
        });
    }

    if (modalAddToCartBtn) {
        modalAddToCartBtn.addEventListener('click', () => {
            const size = productSizeSelector.value;
            if (!size) return;

            const id = currentProductDetails.id;
            const title = `${currentProductDetails.title} (Izmērs: ${size})`;
            const price = currentProductDetails.price;

            // Check availability
            const itemInInventory = inventory.find(i => i.id === id);
            if (itemInInventory && !itemInInventory.available) {
                showNotification('Atvainojiet, šī prece nav pieejama.');
                return;
            }

            const existingItem = cart.find(item => item.id === id && item.title === title);

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

            if (productDetailsOverlay) {
                productDetailsOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll');
            }
        });
    }

    updateCartUI();
});
