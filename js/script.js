document.addEventListener('DOMContentLoaded', () => {
    // Centralized Product Data
    const products = [
        {
            id: 'pluto',
            title: 'Ziemas Cimdi Pluto',
            price: 20.00,
            image: 'Darbinės-pirštinės-PLUTO-WINTER-300x300.png',
            description: 'Augstas kvalitātes ziemas darba cimdi ar siltu iekšējo apšuvumu. Ideāli piemēroti darbam aukstos apstākļos.',
            available: true,
            stock: 'Pieejams',
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'granberg',
            title: 'Granberg Aizsargcimdi',
            price: 25.00,
            image: 'GRANBERG-547-300x300.png',
            description: 'Stiprās Aizsargcimdi ar izturīgu materiālu. Nodrošina lielisku aizsardzību pret mehāniskiem bojājumiem.',
            available: false,
            stock: 'Nav pieejams',
            sizes: ['M', 'L']
        },
        {
            id: 'stepo',
            title: 'Stepo Sintētiskās Ādas Cimdi',
            price: 30.00,
            image: 'Pirštinės-STEPO-161-sintetinės-odos-2-300x300.png',
            description: 'Elastīgi sintētiskās ādas cimdi ar modernu dizainu. Ļoti ērti un elpojoši.',
            available: true,
            stock: 'Pieejams',
            sizes: ['S', 'M', 'L', 'XL', 'XXL']
        },
        {
            id: 'jaka',
            title: 'Pro Darba Jaka',
            price: 45.00,
            image: 'https://placehold.co/300x300/png',
            description: 'Kvalitatīvs darba jakas modelis ar daudzām kabatām un atstarojošiem elementiem.',
            available: true,
            stock: 'Pieejams',
            sizes: ['M', 'L', 'XL', 'XXL']
        }
    ];

    // Initialize Availability Dots
    function initAvailability() {
        products.forEach(item => {
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

    // Cart State
    let cart = JSON.parse(localStorage.getItem('valorProCart')) || [];

    // DOM Elements
    const cartCountElement = document.querySelector('.cart-count');
    const cartTotalElement = document.querySelector('.cart-total');
    const cartIcon = document.querySelector('.cart-icon');
    const cartModalOverlay = document.getElementById('cartModalOverlay');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const closeCart = document.querySelector('.close-modal');

    // Modal Elements
    const productDetailsOverlay = document.getElementById('productDetailsOverlay');
    const quickAddOverlay = document.getElementById('quickAddOverlay'); // We will create this in HTML

    // Helper Functions
    function updateCartUI() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (cartCountElement) cartCountElement.textContent = totalCount;
        if (cartTotalElement) cartTotalElement.textContent = totalPrice.toFixed(2) + '€';

        // Update open cart modal if visible
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

    function addToCart(product, size) {
        if (!product.available) {
            showNotification('Atvainojiet, šī prece nav pieejama.');
            return;
        }

        const titleWithSize = `${product.title} (${size})`;
        const existingItem = cart.find(item => item.id === product.id && item.title === titleWithSize);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: product.id,
                title: titleWithSize,
                price: product.price,
                quantity: 1,
                size: size
            });
        }

        saveCart();
        showNotification('Pievienots grozam!');
    }

    // Modal Logic
    function openProductModal(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.querySelector('.product-details-modal');
        if (!modal) return;

        // Populate Large Modal
        modal.querySelector('.modal-product-image').src = product.image;
        modal.querySelector('.modal-product-title').textContent = product.title;
        modal.querySelector('.modal-product-price').textContent = product.price.toFixed(2) + '€';
        modal.querySelector('.modal-product-availability').textContent = 'Pieejamība: ' + product.stock;
        modal.querySelector('.modal-product-description').textContent = product.description;

        // Size Selector
        const sizeSelector = document.getElementById('productSizeSelector');
        sizeSelector.innerHTML = '<option value="">Izvēlies izmēru</option>';
        product.sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            sizeSelector.appendChild(option);
        });

        const addToCartBtn = modal.querySelector('.modal-add-to-cart-btn');
        addToCartBtn.disabled = true;

        // Remove old listeners to prevent duplicates (cloning is a simple way)
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

        newBtn.addEventListener('click', () => {
            const selectedSize = sizeSelector.value;
            if (selectedSize) {
                addToCart(product, selectedSize);
                closeModal();
            }
        });

        sizeSelector.onchange = () => {
            newBtn.disabled = !sizeSelector.value;
        };

        if (productDetailsOverlay) {
            productDetailsOverlay.style.display = 'flex';
            document.body.classList.add('no-scroll');
        }
    }

    function openQuickAddModal(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.querySelector('.quick-add-modal');
        if (!modal) return;

        // Populate Quick Add Modal
        modal.querySelector('.quick-product-image').src = product.image;
        modal.querySelector('.quick-product-title').textContent = product.title;
        modal.querySelector('.quick-product-price').textContent = product.price.toFixed(2) + '€';
        modal.querySelector('.quick-product-stock').textContent = 'Pieejamība: ' + product.stock;

        // Size Selector
        const sizeSelector = document.getElementById('quickSizeSelector');
        sizeSelector.innerHTML = '<option value="">Izvēlies izmēru</option>';
        product.sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            sizeSelector.appendChild(option);
        });

        const addToCartBtn = modal.querySelector('.quick-add-btn');
        addToCartBtn.disabled = true;

        // Replace button to clear listeners
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

        newBtn.addEventListener('click', () => {
            const selectedSize = sizeSelector.value;
            if (selectedSize) {
                addToCart(product, selectedSize);
                closeModal();
            }
        });

        sizeSelector.onchange = () => {
            newBtn.disabled = !sizeSelector.value;
        };

        if (quickAddOverlay) {
            quickAddOverlay.style.display = 'flex';
            document.body.classList.add('no-scroll');
        }
    }

    function closeModal() {
        if (productDetailsOverlay) productDetailsOverlay.style.display = 'none';
        if (quickAddOverlay) quickAddOverlay.style.display = 'none';
        if (cartModalOverlay) cartModalOverlay.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }

    // Event Listeners for Product Cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Prevent if clicked on add-to-cart button (handled separately)
            if (e.target.closest('.add-to-cart-btn')) return;

            // Find product ID from the button inside the card (as a reference)
            // Or better, add data-id to the card itself in HTML update
            const btn = card.querySelector('.add-to-cart-btn');
            if (btn) {
                const id = btn.dataset.id;
                openProductModal(id);
            }
        });
    });

    // Event Listeners for "Pievienot grozam" buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop card click
            const id = btn.dataset.id;
            openQuickAddModal(id);
        });
    });

    // Close Modals
    document.querySelectorAll('.close-details-modal, .close-quick-modal, .close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    window.addEventListener('click', (e) => {
        if (e.target === productDetailsOverlay || e.target === quickAddOverlay || e.target === cartModalOverlay) {
            closeModal();
        }
    });

    // Cart Modal Logic (Existing)
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
                cart.splice(index, 1);
                saveCart();
                renderCartModal();
            });
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            closeModal();
            showNotification('Paldies! Pasūtījums noformēts (simulācija).');
        });
    }

    updateCartUI();
});
