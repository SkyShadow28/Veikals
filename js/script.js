// ======================================================================
// VALORPRO E-VEIKALA SCRIPT.JS — LABOTA VERSIJA
// ======================================================================

const DATA_API_URL = 'https://script.google.com/macros/s/AKfycbx3mASJf_j7nDacERKl1Ai3gzX1SjdGmqQrKUyQ7fsQN60Jr3XagU_yZhijcnPWmRdr/exec';

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('valorProCart')) || [];

// ======================================================================
// 1. PALĪGFUNKCIJAS
// ======================================================================

function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + '€';
}

function getProductDataById(productId) {
    return allProducts.find(p => p.id === productId);
}

// ✅ LABOTS: funkcija ir globālā līmenī, nevis iekšā citā funkcijā
function convertGoogleDriveUrl(url) {
    if (!url || url.trim() === '') return 'images/placeholder.png';

    // variants: /file/d/XXXX/view
    let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }

    // variants: ?id=XXXX vai &id=XXXX
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }

    // Ja nav Drive saite, atdod kā ir
    return url;
}

// ======================================================================
// 2. DATU IELĀDE UN RENDERĒŠANA
// ======================================================================

async function fetchAndRenderProducts() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    productGrid.innerHTML = '<p class="loading-message">Notiek produktu ielāde...</p>';

    try {
        const response = await fetch(DATA_API_URL);
        if (!response.ok) throw new Error(`HTTP kļūda! Statuss: ${response.status}`);

        const data = await response.json();

        // ✅ LABOTS: noņemta vecā rinda "allProducts = productsFromSheet"
        allProducts = data.map((product, index) => {

            const generatedId = product.name
                ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + index
                : `product-${index}`;

            let sizesList = ['Vienots'];
            if (Array.isArray(product.sizes)) {
                sizesList = product.sizes;
            } else if (typeof product.sizes === 'string' && product.sizes.trim() !== '') {
                sizesList = product.sizes.split(';').map(s => s.trim()).filter(s => s !== '');
            }

            // ✅ LABOTS: convertGoogleDriveUrl tiek izsaukta pareizi
            const imageUrl = convertGoogleDriveUrl(product.image);

            return {
                id: generatedId,
                title: product.name || 'Produkts',
                price: parseFloat(product.price) || 0,
                image: imageUrl,
                description: product.description || '',
                available: parseInt(product.quantity) > 0,
                stock: parseInt(product.quantity) > 0 ? 'Pieejams' : 'Nav pieejams',
                sizes: sizesList
            };
        });

        renderProducts(allProducts);

    } catch (error) {
        console.error('Kļūda, ielādējot datus no Sheets API:', error);
        productGrid.innerHTML = `
            <div class="error-message" style="text-align:center; padding:20px; color:red;">
                <p>Neizdevās ielādēt produktus.</p>
                <p style="font-size:0.8em; color:#666;">${error.message}</p>
            </div>`;
    }
}

function renderProducts(productsToRender) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    productGrid.innerHTML = '';

    if (productsToRender.length === 0) {
        productGrid.innerHTML = '<p class="loading-message">Neviens produkts neatbilst jūsu kritērijiem.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-id', product.id);

        productCard.innerHTML = `
            <div class="product-content-wrapper">
                <img src="${product.image}" alt="${product.title}" onerror="this.src='images/placeholder.png'">
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <p class="price">${formatPrice(product.price)}</p>
                    <span class="status-dot ${product.available ? 'status-green' : 'status-red'}"
                          data-tooltip="${product.available ? 'Pieejams' : 'Nav pieejams'}"></span>
                </div>
            </div>
            <div class="actions">
                <button data-id="${product.id}" class="btn add-to-cart-btn">Pievienot grozam</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
}

// ======================================================================
// 3. MEKLĒŠANAS LOĢIKA
// ======================================================================

function initSearch() {
    const searchInput = document.querySelector('.search-bar input[type="text"]');
    if (!searchInput) return;

    searchInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allProducts.filter(product =>
            product.title.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
        renderProducts(filtered);
    });
}

// ======================================================================
// 4. GROZA LOĢIKA
// ======================================================================

function updateCartUI() {
    const cartCountElement = document.querySelector('.cart-count');
    const cartTotalElement = document.querySelector('.cart-total');
    const cartTotalModalElement = document.querySelector('.cart-total-modal');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cartCountElement) cartCountElement.textContent = totalCount;
    if (cartTotalElement) cartTotalElement.textContent = totalPrice.toFixed(2) + '€';
    if (cartTotalModalElement) cartTotalModalElement.textContent = totalPrice.toFixed(2) + '€';

    const cartModalOverlay = document.getElementById('cartModalOverlay');
    if (cartModalOverlay && cartModalOverlay.style.display === 'flex') {
        renderCartModal();
    }
}

function saveCart() {
    localStorage.setItem('valorProCart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(product, size, qty = 1) {
    if (!product.available) {
        showNotification('Atvainojiet, šī prece nav pieejama.');
        return;
    }

    const titleWithSize = `${product.title} (${size})`;
    const existingItem = cart.find(item => item.id === product.id && item.title === titleWithSize);

    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({
            id: product.id,
            title: titleWithSize,
            price: product.price,
            quantity: qty,
            size: size
        });
    }

    saveCart();
    showNotification(`Pievienots grozam! (${qty} gab.)`);
}

function renderCartModal() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
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
    totalElement.style.cssText = 'margin-top:15px; text-align:right; font-size:1.2em; font-weight:bold;';
    totalElement.innerHTML = `Kopā: ${total.toFixed(2)}€`;
    cartItemsContainer.appendChild(totalElement);

    cartItemsContainer.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            cart.splice(index, 1);
            saveCart();
            renderCartModal();
        });
    });
}

// ======================================================================
// 5. MODĀLO LOGU LOĢIKA
// ======================================================================

function closeModal() {
    const productDetailsOverlay = document.getElementById('productDetailsOverlay');
    const quickAddOverlay = document.getElementById('quickAddOverlay');
    const cartModalOverlay = document.getElementById('cartModalOverlay');

    if (productDetailsOverlay) productDetailsOverlay.style.display = 'none';
    if (quickAddOverlay) quickAddOverlay.style.display = 'none';
    if (cartModalOverlay) cartModalOverlay.style.display = 'none';
    document.body.classList.remove('no-scroll');
}

function openProductDetailsModal(productId) {
    const product = getProductDataById(productId);
    if (!product) return;

    const overlay = document.getElementById('productDetailsOverlay');
    const modal = overlay ? overlay.querySelector('.product-details-modal') : null;
    if (!modal) return;

    modal.querySelector('.modal-product-image').src = product.image;
    modal.querySelector('.modal-product-title').textContent = product.title;
    modal.querySelector('.modal-product-price').textContent = formatPrice(product.price);
    modal.querySelector('.modal-product-availability').textContent = 'Pieejamība: ' + product.stock;
    modal.querySelector('.modal-product-description').textContent = product.description;

    const sizeSelector = document.getElementById('productSizeSelector');
    sizeSelector.innerHTML = '<option value="">Izvēlies izmēru</option>';
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        sizeSelector.appendChild(option);
    });

    // Daudzuma izvēlētājs
    const qtyDisplay = modal.querySelector('.modal-qty-display');
    if (qtyDisplay) qtyDisplay.textContent = '1';

    const minusBtn = modal.querySelector('.modal-qty-minus');
    const plusBtn = modal.querySelector('.modal-qty-plus');
    if (minusBtn) minusBtn.onclick = () => {
        const current = parseInt(qtyDisplay.textContent);
        if (current > 1) qtyDisplay.textContent = current - 1;
    };
    if (plusBtn) plusBtn.onclick = () => {
        const current = parseInt(qtyDisplay.textContent);
        qtyDisplay.textContent = current + 1;
    };

    const addToCartBtn = modal.querySelector('.modal-add-to-cart-btn');
    addToCartBtn.disabled = true;

    const newBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

    sizeSelector.onchange = () => { newBtn.disabled = !sizeSelector.value; };

    newBtn.addEventListener('click', () => {
        const selectedSize = sizeSelector.value;
        const qty = qtyDisplay ? parseInt(qtyDisplay.textContent) : 1;
        if (selectedSize) {
            addToCart(product, selectedSize, qty);
            closeModal();
        }
    });

    overlay.style.display = 'flex';
    document.body.classList.add('no-scroll');
}

function openQuickAddModal(productId) {
    const product = getProductDataById(productId);
    if (!product) return;

    const overlay = document.getElementById('quickAddOverlay');
    const modal = overlay ? overlay.querySelector('.quick-add-modal') : null;
    if (!modal) return;

    modal.querySelector('.quick-product-image').src = product.image;
    modal.querySelector('.quick-product-title').textContent = product.title;
    modal.querySelector('.quick-product-price').textContent = formatPrice(product.price);
    modal.querySelector('.quick-product-stock').textContent = 'Pieejamība: ' + product.stock;

    const sizeSelector = document.getElementById('quickSizeSelector');
    sizeSelector.innerHTML = '<option value="">Izvēlies izmēru</option>';
    product.sizes.forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size;
        sizeSelector.appendChild(option);
    });

    // Daudzuma izvēlētājs
    const qtyDisplay = modal.querySelector('.quick-qty-display');
    if (qtyDisplay) qtyDisplay.textContent = '1';

    const minusBtn = modal.querySelector('.quick-qty-minus');
    const plusBtn = modal.querySelector('.quick-qty-plus');
    if (minusBtn) minusBtn.onclick = () => {
        const current = parseInt(qtyDisplay.textContent);
        if (current > 1) qtyDisplay.textContent = current - 1;
    };
    if (plusBtn) plusBtn.onclick = () => {
        const current = parseInt(qtyDisplay.textContent);
        qtyDisplay.textContent = current + 1;
    };

    const addToCartBtn = modal.querySelector('.quick-add-btn');
    addToCartBtn.disabled = true;

    const newBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

    sizeSelector.onchange = () => { newBtn.disabled = !sizeSelector.value; };

    newBtn.addEventListener('click', () => {
        const selectedSize = sizeSelector.value;
        const qty = qtyDisplay ? parseInt(qtyDisplay.textContent) : 1;
        if (selectedSize) {
            addToCart(product, selectedSize, qty);
            closeModal();
        }
    });

    overlay.style.display = 'flex';
    document.body.classList.add('no-scroll');
}

function showNotification(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: #2ECC71;"></i> ${message}`;
    container.appendChild(toast);
    toast.offsetHeight; // reflow
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) container.removeChild(toast);
        }, 300);
    }, 3000);
}

// ======================================================================
// 6. NOTIKUMU KLAUSĪTĀJI — IELĀDE
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {

    fetchAndRenderProducts();
    updateCartUI();
    initSearch();

    // ✅ LABOTS: tikai VIENS event listener uz product-grid
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        productGrid.addEventListener('click', (e) => {

            // "Pievienot grozam" poga → atver Quick Add modālo
            const addBtn = e.target.closest('.add-to-cart-btn');
            if (addBtn) {
                e.stopPropagation();
                openQuickAddModal(addBtn.dataset.id);
                return;
            }

            // Klikšķis uz kartītes → atver Product Details modālo
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                const id = productCard.getAttribute('data-id');
                if (id) openProductDetailsModal(id);
            }
        });
    }

    // Groza ikona
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            renderCartModal();
            const cartModalOverlay = document.getElementById('cartModalOverlay');
            if (cartModalOverlay) {
                cartModalOverlay.style.display = 'flex';
                document.body.classList.add('no-scroll');
            }
        });
    }

    // Aizvēršanas pogas
    document.querySelectorAll('.close-details-modal, .close-quick-modal, .close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Aizvēršana klikšķinot ārpus modālā
    window.addEventListener('click', (e) => {
        const overlays = ['productDetailsOverlay', 'quickAddOverlay', 'cartModalOverlay'];
        overlays.forEach(id => {
            const overlay = document.getElementById(id);
            if (e.target === overlay) closeModal();
        });
    });

    // Checkout poga
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            closeModal();
            cart = [];
            saveCart();
            showNotification('Paldies! Pasūtījums noformēts.');
        });
    }
});

// ======================================================================
// BEIGAS
// ======================================================================
