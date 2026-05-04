// ======================================================================
// VALORPRO E-VEIKALA SCRIPT.JS (APVIENOTS AR SHEETS DATIEM)
// ======================================================================

// 🛑 STEP 1: Ievietojiet savu pareizo Google Apps Script URL (kas beidzas ar /exec)!
const DATA_API_URL = 'https://script.google.com/macros/s/AKfycbx3mASJf_j7nDacERKl1Ai3gzX1SjdGmqQrKUyQ7fsQN60Jr3XagU_yZhijcnPWmRdr/exec';

let allProducts = []; // Glabā ielādētos produktus
let cart = JSON.parse(localStorage.getItem('valorProCart')) || []; // Groza saturs

// ======================================================================
// 1. DATU IELĀDES UN RENDERĒŠANAS LOĢIKA
// ======================================================================

async function fetchAndRenderProducts() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    productGrid.innerHTML = '<p class="loading-message">Notiek produktu ielāde...</p>';

    try {
        const response = await fetch(DATA_API_URL);
        if (!response.ok) throw new Error(`HTTP kļūda! Statuss: ${response.status}`);

        const data = await response.json();

        allProducts = data.map((product, index) => {
            const generatedId = product.name
                ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                : `product-${index}`;

            let sizesList = ['Vienots'];
            if (Array.isArray(product.sizes)) {
                sizesList = product.sizes;
            } else if (typeof product.sizes === 'string' && product.sizes.trim() !== '') {
                sizesList = product.sizes.split(";").map(s => s.trim());
            }

            // ✅ LABOTS: funkcija definēta ĀRPUS .map() un pareizi izsaukta
            const imageUrl = convertGoogleDriveUrl(product.image);

            return {
                id: generatedId,
                title: product.name || 'Produkts',
                price: parseFloat(product.price) || 0,
                image: imageUrl,
                description: product.description || '',
                available: product.quantity > 0,
                stock: product.quantity > 0 ? 'Pieejams' : 'Nav pieejams',
                sizes: sizesList
            };
        });

        renderProducts(allProducts);

    } catch (error) {
        console.error("Kļūda:", error);
        productGrid.innerHTML = `<div class="error-message">Neizdevās ielādēt produktus: ${error.message}</div>`;
    }
}

// ✅ LABOTS: funkcija ir ĀRPUS fetchAndRenderProducts, globālā līmenī
function convertGoogleDriveUrl(url) {
    if (!url || url.trim() === '') return 'images/placeholder.png';

    // variants: /file/d/XXXX/view
    let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        // thumbnail URL strādā bez CORS problēmām
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }

    // variants: ?id=XXXX
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
    }


    return url; // ja nav Drive saite, atdod kā ir
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
        // Kritiski: data-id ir nepieciešams, lai atvērtu modālo logu
        productCard.setAttribute('data-id', product.id);

        const formattedPrice = formatPrice(product.price);

        productCard.innerHTML = `
            <div class="product-content-wrapper">
                <img src="${product.image}" alt="${product.title}" onerror="this.src='images/placeholder.png'">
                <div class="product-info">
                    <h3>${product.title}</h3>

                    <p class="price">${formattedPrice}</p>
                    <span class="status-dot ${product.available ? 'status-green' : 'status-red'}" data-tooltip="${product.available ? 'Pieejams' : 'Nav pieejams'}"></span> 
                </div>
            </div>
            
            <div class="actions">
                <button data-id="${product.id}" class="btn add-to-cart-btn">Pievienot grozam</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
}

// ----------------------------------------------------------------------
// 2. MEKLĒŠANAS LOĢIKA
// ----------------------------------------------------------------------

const searchInput = document.querySelector('.search-bar input[type="text"]');

if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        const filteredProducts = allProducts.filter(product => {
            return (
                product.title.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        });

        renderProducts(filteredProducts);
    });
}

// ======================================================================
// 3. GROZA un MODĀLO LOGU LOĢIKA (saglabāta)
// ======================================================================

// DOM Elements
const cartCountElement = document.querySelector('.cart-count');
const cartTotalElement = document.querySelector('.cart-total');
const cartIcon = document.querySelector('.cart-icon');
const cartModalOverlay = document.getElementById('cartModalOverlay');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const checkoutBtn = document.querySelector('.checkout-btn');

// Modal Elements
const productDetailsOverlay = document.getElementById('productDetailsOverlay');
const quickAddOverlay = document.getElementById('quickAddOverlay');

// Helper Functions
function formatPrice(price) {
    return price.toFixed(2).replace('.', ',') + '€';
}

function getProductDataById(productId) {
    return allProducts.find(p => p.id === productId);
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const formattedPrice = totalPrice.toFixed(2) + '€';

    // Atjaunina groza skaitu un summu galvenē
    if (cartCountElement) cartCountElement.textContent = totalCount;
    if (cartTotalElement) cartTotalElement.textContent = formattedPrice;

    // Atjaunina groza summu modālajā logā
    const cartTotalModalElement = document.querySelector('.cart-total-modal');
    if (cartTotalModalElement) cartTotalModalElement.textContent = formattedPrice;

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
function openProductDetailsModal(productId) {
    const product = getProductDataById(productId);
    if (!product) return;

    const modal = document.querySelector('.product-details-modal');
    if (!modal) return;

    // Populate Large Modal
    modal.querySelector('.modal-product-image').src = product.image;
    modal.querySelector('.modal-product-title').textContent = product.title;
    modal.querySelector('.modal-product-price').textContent = formatPrice(product.price);
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

    if (productDetailsOverlay) {
        productDetailsOverlay.style.display = 'flex';
        document.body.classList.add('no-scroll');
    }
}

function openQuickAddModal(productId) {
    const product = getProductDataById(productId);
    if (!product) return;

    const modal = document.querySelector('.quick-add-modal');
    if (!modal) return;

    // Populate Quick Add Modal
    modal.querySelector('.quick-product-image').src = product.image;
    modal.querySelector('.quick-product-title').textContent = product.title;
    modal.querySelector('.quick-product-price').textContent = formatPrice(product.price);
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


// ======================================================================
// 4. DOKUMENTA IELĀDE UN NOTIKUMU KLAUSĪTĀJI
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. Datu Ielāde un Groza Atjaunināšana
    fetchAndRenderProducts();
    updateCartUI();

    // 2. Notikumu Deleģēšana (Produktu klikšķi)
    const mainProductContainer = document.getElementById('product-grid');

    if (mainProductContainer) {
        mainProductContainer.addEventListener('click', (e) => {

            const addToCartBtn = e.target.closest('.add-to-cart-btn');
            if (addToCartBtn) {
                e.stopPropagation();
                openQuickAddModal(addToCartBtn.dataset.id);
                return;
            }

            const productCard = e.target.closest('.product-card');
            if (productCard) {
                const id = productCard.getAttribute('data-id');
                if (id) openProductDetailsModal(id);
            }
        });
    }

    // 3. Groza ikona un modālo logu aizvēršana
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

    // Modal aizvēršanas pogas
    document.querySelectorAll('.close-details-modal, .close-quick-modal, .close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Aizvēršana klikšķinot ārpus modālā loga
    window.addEventListener('click', (e) => {
        if (e.target === productDetailsOverlay || e.target === quickAddOverlay || e.target === cartModalOverlay) {
            closeModal();
        }
    });

    // Checkout poga (simulācija)
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            closeModal();
            // Pievienojiet šeit Jūsu AJAX loģiku, ja nepieciešams nosūtīt datus uz serveri/e-pastu
            cart = []; // Iztīra grozu pēc veiksmīgas noformēšanas
            saveCart();
            showNotification('Paldies! Pasūtījums noformēts (simulācija).');
        });
    }

});
// ======================================================================
// BEIGAS
// ======================================================================