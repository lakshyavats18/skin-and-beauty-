/**
 * TENICIDE LUXURY CART DRAWER
 * Implements persistent drawer cart, real-time quantity updates,
 * free delivery progress, and exact empty state matching store design.
 */

const TenicideCart = (function() {
  const STORAGE_KEY = 'tenicide_cart_v1';
  const FREE_SHIPPING_THRESHOLD = 75.00;

  // Initial default items matching the '3' badge on first visit
  const DEFAULT_ITEMS = [
    {
      id: 'serum',
      title: 'Advanced Cellular Renewal Serum',
      price: 78.00,
      image: 'assets/product-serum.jpg',
      variant: '30ml / 1.0 fl oz',
      quantity: 1
    },
    {
      id: 'cleanser',
      title: 'Cellular Clarifying Cleanser',
      price: 48.00,
      image: 'assets/product-cleanser.jpg',
      variant: '150ml / 5.1 fl oz',
      quantity: 1
    },
    {
      id: 'cream',
      title: 'Lipid Restorative Cream',
      price: 64.00,
      image: 'assets/product-cream.jpg',
      variant: '50ml / 1.7 fl oz',
      quantity: 1
    }
  ];

  function getCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading cart from localStorage', e);
    }
    // Return default items on very first visit
    return DEFAULT_ITEMS;
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
    updateBadges();
    render();
  }

  function getTotalCount(cart) {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function getSubtotal(cart) {
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  }

  function updateBadges() {
    const cart = getCart();
    const count = getTotalCount(cart);
    const badges = document.querySelectorAll('.cart-count, [data-cart-count]');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count >= 0 ? 'flex' : 'none';
    });
  }

  function injectDrawerMarkup() {
    if (document.getElementById('tenicide-cart-drawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'tenicide-cart-overlay';
    overlay.className = 'tenicide-cart-overlay';
    overlay.onclick = close;

    const drawer = document.createElement('aside');
    drawer.id = 'tenicide-cart-drawer';
    drawer.className = 'tenicide-cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Shopping Cart');

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  function render() {
    const drawer = document.getElementById('tenicide-cart-drawer');
    if (!drawer) return;

    const cart = getCart();
    const count = getTotalCount(cart);
    const subtotal = getSubtotal(cart);

    if (cart.length === 0) {
      // EXACT EMPTY STATE REPRODUCING IMAGE 2
      drawer.innerHTML = `
        <div class="cart-empty-wrapper">
          <div class="cart-drawer-header cart-drawer-header--empty">
            <div></div>
            <button class="cart-close-circle" onclick="TenicideCart.close()" aria-label="Close cart" title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="cart-empty-body">
            <h2 class="cart-empty-title">Your cart is empty</h2>
            <p class="cart-empty-text">Have an account? <a href="#" class="cart-login-link" onclick="alert('Shopify Account Login: Connect to your customer portal.'); return false;">Log in</a> to check out faster.</p>
            <button class="cart-continue-btn" onclick="TenicideCart.close()">Continue shopping</button>
          </div>
        </div>
      `;
      return;
    }

    // FILLED CART STATE
    const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    const itemsHtml = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__media">
          <img src="${item.image}" alt="${item.title}" class="cart-item__img" onerror="this.src='assets/product-serum.jpg'">
        </div>
        <div class="cart-item__content">
          <div class="cart-item__header">
            <h4 class="cart-item__title">${item.title}</h4>
            <button class="cart-item__remove" onclick="TenicideCart.removeItem('${item.id}')" title="Remove item" aria-label="Remove ${item.title}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          ${item.variant ? `<p class="cart-item__variant">${item.variant}</p>` : ''}
          <div class="cart-item__bottom">
            <div class="cart-item__stepper">
              <button class="cart-stepper-btn" onclick="TenicideCart.updateQty('${item.id}', -1)" aria-label="Decrease quantity">&minus;</button>
              <span class="cart-stepper-val">${item.quantity || 1}</span>
              <button class="cart-stepper-btn" onclick="TenicideCart.updateQty('${item.id}', 1)" aria-label="Increase quantity">&plus;</button>
            </div>
            <div class="cart-item__price">$${(item.price * (item.quantity || 1)).toFixed(2)}</div>
          </div>
        </div>
      </div>
    `).join('');

    drawer.innerHTML = `
      <div class="cart-filled-wrapper">
        <div class="cart-drawer-header">
          <div class="cart-drawer-heading-wrap">
            <h2 class="cart-drawer-heading">Your cart</h2>
            <span class="cart-drawer-badge">${count}</span>
          </div>
          <button class="cart-close-circle" onclick="TenicideCart.close()" aria-label="Close cart" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="cart-shipping-bar">
          <div class="cart-shipping-msg">
            ${remainingForFree > 0 
              ? `You are <strong style="color:var(--lx-gold-primary);">$${remainingForFree.toFixed(2)}</strong> away from <strong>Free Global Delivery</strong>`
              : `<span style="color:#2E7D32; font-weight:600;">✓ Complimentary Express Delivery Unlocked!</span>`
            }
          </div>
          <div class="cart-shipping-progress">
            <div class="cart-shipping-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>

        <div class="cart-items-scroll">
          ${itemsHtml}
        </div>

        <div class="cart-drawer-footer">
          <div class="cart-subtotal-row">
            <span class="cart-subtotal-label">Subtotal</span>
            <span class="cart-subtotal-val">$${subtotal.toFixed(2)}</span>
          </div>
          <p class="cart-tax-notice">Taxes and shipping calculated at checkout.</p>
          
          <button class="cart-checkout-btn" onclick="TenicideCart.handleCheckout()">
            <span>Check out &bull; $${subtotal.toFixed(2)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          
          <div class="cart-footer-links">
            <button class="cart-continue-link" onclick="TenicideCart.close()">Continue shopping</button>
            <button class="cart-clear-link" onclick="TenicideCart.clearCart()">Empty cart</button>
          </div>
        </div>
      </div>
    `;
  }

  function open() {
    injectDrawerMarkup();
    render();
    const overlay = document.getElementById('tenicide-cart-overlay');
    const drawer = document.getElementById('tenicide-cart-drawer');
    if (overlay && drawer) {
      overlay.classList.add('active');
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function close() {
    const overlay = document.getElementById('tenicide-cart-overlay');
    const drawer = document.getElementById('tenicide-cart-drawer');
    if (overlay && drawer) {
      overlay.classList.remove('active');
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function toggle() {
    const drawer = document.getElementById('tenicide-cart-drawer');
    if (drawer && drawer.classList.contains('active')) {
      close();
    } else {
      open();
    }
  }

  function addItem(product) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + (product.quantity || 1);
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: parseFloat(product.price),
        image: product.image,
        variant: product.variant || '',
        quantity: product.quantity || 1
      });
    }

    saveCart(cart);
    open();
  }

  function updateQty(id, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity = (item.quantity || 1) + delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== id);
    }

    saveCart(cart);
  }

  function removeItem(id) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function handleCheckout() {
    // If running on Shopify storefront, forward to /checkout
    if (window.Shopify && window.Shopify.routes) {
      window.location.href = '/checkout';
    } else {
      // Local preview simulation
      const cart = getCart();
      const subtotal = getSubtotal(cart);
      alert(`Proceeding to Secure Checkout:\n${cart.length} item(s) • Total: $${subtotal.toFixed(2)}\n\nIn Shopify production, this redirects directly to the Shopify One-Page Checkout.`);
    }
  }

  function init() {
    injectDrawerMarkup();
    updateBadges();

    // Bind all cart buttons across the page
    document.addEventListener('click', function(e) {
      const trigger = e.target.closest('.icon-btn, .cart-drawer-trigger, [data-cart-trigger], .cart-count');
      if (trigger) {
        // Check if the icon button is indeed the cart button (contains cart SVG or cart-count)
        if (trigger.querySelector('.cart-count') || trigger.classList.contains('cart-count') || trigger.getAttribute('title') === 'Cart' || trigger.getAttribute('aria-label') === 'Cart') {
          e.preventDefault();
          e.stopPropagation();
          open();
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        close();
      }
    });
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    open,
    close,
    toggle,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    handleCheckout,
    getCart
  };
})();
