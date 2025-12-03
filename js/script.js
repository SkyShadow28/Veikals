// Main script for Valor Pro website

document.addEventListener('DOMContentLoaded', () => {
    console.log('Valor Pro website loaded');

    // Cart Functionality
    let cartCount = 0;
    let cartTotal = 0.00;

    const cartCountElement = document.querySelector('.cart-count');
    const cartTotalElement = document.querySelector('.cart-total');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Get price from data attribute or parse from text if needed
            // For now, let's assume we added data-price to buttons in HTML
            // If not, we can parse it from the sibling element, but data attribute is cleaner.
            // I added data-price to buttons in the HTML update.

            const price = parseFloat(button.getAttribute('data-price'));

            if (!isNaN(price)) {
                cartCount++;
                cartTotal += price;

                // Update UI
                cartCountElement.textContent = cartCount;
                cartTotalElement.textContent = cartTotal.toFixed(2) + '€';

                // Optional: Animation or feedback
                button.textContent = 'Pievienots!';
                button.classList.add('btn-success');
                setTimeout(() => {
                    button.textContent = 'Pievienot grozam';
                    button.classList.remove('btn-success');
                }, 2000);
            }
        });
    });
});
