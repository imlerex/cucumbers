/**
 * ЦАРЬ-ОГУРЕЦ · Store, Cart & Checkout Engine
 * Catalog rendering, category filters, reactive cart drawer,
 * Telegram checkout, Go Backend API order dispatch, and UI interactions.
 */

(function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    brand: 'ЦАРЬ-ОГУРЕЦ',
    tagline: 'Артизанальные маринованные огурцы высшей пробы',
    currency: 'BYN',
    telegram: 'cucumber_king',          // Ник в Telegram
    phone: '+375 (29) 777-88-99',       // Телефон для заказов
    instagram: 'tsar_ogurets',          // Instagram
    freeDeliveryFrom: 60,               // Бесплатная доставка от 60 BYN
    deliveryTerms: [
      'Доставка курьером до двери: от 1-2 дней после подтверждения',
      'Стоимость доставки: 5 BYN (бесплатно при заказе от 60 BYN)',
      'Самовывоз из фирменного погреба: бесплатно, ул. Ремесленная 12',
      'Оплата: наличными или картой при получении, либо по QR-коду'
    ]
  };

  // --- Product Catalog ---
  const PRODUCTS = [
    {
      id: 1,
      name: 'Классические «Бочковые»',
      vol: '0,9 л',
      price: 12,
      tag: 'Хит',
      category: 'hit',
      color: '#4aa844',
      desc: 'Плотный хруст, укропные соцветия, чеснок и дубовый лист. Тот самый эталонный вкус.'
    },
    {
      id: 2,
      name: 'Огненные «Чили-Взрыв»',
      vol: '0,9 л',
      price: 13,
      tag: 'Острые',
      category: 'spicy',
      color: '#c0392b',
      desc: 'Стручковый перец чили, сычуаньский горошек и горчица. Для любителей жгучего хруста.'
    },
    {
      id: 3,
      name: 'Чесночные с хреном',
      vol: '0,9 л',
      price: 13,
      tag: 'Популярно',
      category: 'hit',
      color: '#7bb342',
      desc: 'Щедрая порция молодого чеснока и свеженатертого корня хрена. Яркий бодрящий аромат.'
    },
    {
      id: 4,
      name: 'Сладко-пряные медовые',
      vol: '0,9 л',
      price: 14,
      tag: 'Новинка',
      category: 'new',
      color: '#d4a017',
      desc: 'Мягкий яблочный маринад с капелькой лугового мёда, зёрнами белой горчицы и гвоздикой.'
    },
    {
      id: 5,
      name: 'Малосольные «Летний хруст»',
      vol: '0,5 л',
      price: 9,
      tag: 'Свежее',
      category: 'fresh',
      color: '#6bbf59',
      desc: 'Засолены 24 часа назад. Изумрудная кожица, нежная мякоть и максимум свежести.'
    },
    {
      id: 6,
      name: 'Дегустационный сет «Три вкуса»',
      vol: '3 × 0,5 л',
      price: 26,
      tag: 'Выгодно',
      category: 'sale',
      color: '#2e7d46',
      desc: 'Три разные банки: Классические, Чесночные и Сладко-пряные. Идеально для подарка и дегустации.'
    },
    {
      id: 7,
      name: 'Царские Корнишоны Reserve',
      vol: '0,7 л',
      price: 16,
      tag: 'Премиум',
      category: 'premium',
      color: '#25793e',
      desc: 'Отборные миниатюрные корнишоны до 6 см в настое дубовой коры и смородинового листа.'
    },
    {
      id: 8,
      name: 'Деревенские с вишнёвым листом',
      vol: '1,0 л',
      price: 15,
      tag: 'Традиция',
      category: 'hit',
      color: '#3a9b52',
      desc: 'Крупные хрустящие огурцы по старинному рецепту вологодских мастеров погребной засолки.'
    }
  ];

  // Helper selectors
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const money = (n) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ' + CONFIG.currency;

  // --- SVG Jar Generator ---
  function renderJarSVG(color) {
    return `
      <svg viewBox="0 0 110 140" aria-hidden="true">
        <!-- Jar Lid & Seal -->
        <rect x="30" y="8" width="50" height="15" rx="5" fill="#1b5e20" stroke="#38e872" stroke-width="1.5"/>
        <line x1="34" y1="13" x2="76" y2="13" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
        <rect x="36" y="23" width="38" height="6" fill="#a3f7be" opacity="0.6"/>
        
        <!-- Glass Jar Contour -->
        <path d="M28 29 Q14 36 14 54 L14 116 Q14 132 30 132 L80 132 Q96 132 96 116 L96 54 Q96 36 82 29 Z" 
              fill="rgba(255,255,255,0.06)" stroke="#5edb7f" stroke-width="2.5"/>
        
        <!-- Brine Liquid Fill -->
        <path d="M18 58 H92 V116 Q92 128 80 128 H30 Q18 128 18 116 Z" 
              fill="${color}" opacity="0.35"/>
        
        <!-- Pickles Inside -->
        <rect x="28" y="52" width="16" height="74" rx="8" fill="${color}" transform="rotate(-6 36 90)"/>
        <rect x="47" y="48" width="17" height="78" rx="8.5" fill="${color}"/>
        <rect x="66" y="54" width="15" height="72" rx="7.5" fill="${color}" transform="rotate(7 73 90)"/>
        
        <!-- Dill seeds & garlic bits -->
        <circle cx="36" cy="75" r="2" fill="#ffd666"/>
        <circle cx="58" cy="95" r="2.5" fill="#ffd666"/>
        <circle cx="76" cy="80" r="2" fill="#ffd666"/>
        <circle cx="48" cy="118" r="3" fill="#fff" opacity="0.8"/>
        
        <!-- Label -->
        <rect x="32" y="78" width="46" height="28" rx="4" fill="#fdfbf7" stroke="#1b5e20" stroke-width="1.2"/>
        <text x="55" y="93" text-anchor="middle" font-family="'Segoe UI',sans-serif" font-weight="900" font-size="8" fill="#0d2e15">ОГУРЦЫ</text>
        <text x="55" y="101" text-anchor="middle" font-family="'Segoe UI',sans-serif" font-size="6" font-weight="600" fill="#66736b">артизанал</text>
        
        <!-- Glass reflections -->
        <path d="M22 45 Q20 85 24 118" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
        <path d="M88 45 Q90 85 86 118" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.3"/>
      </svg>
    `;
  }

  // --- Render Products ---
  function renderCatalog(filter = 'all') {
    const grid = $('#productsGrid');
    if (!grid) return;

    const filtered = filter === 'all' 
      ? PRODUCTS 
      : PRODUCTS.filter(p => p.category === filter || (filter === 'hit' && p.tag === 'Хит'));

    grid.innerHTML = filtered.map(p => `
      <article class="p-card glass rv" data-id="${p.id}">
        <div class="p-pic">
          ${p.tag ? `<span class="p-tag ${p.category === 'hit' ? 'hit' : ''}">${p.tag}</span>` : ''}
          <button class="p-spin-trigger" title="Крутить в 3D" aria-label="Покрутить огурец">🥒</button>
          ${renderJarSVG(p.color)}
        </div>
        <div class="p-body">
          <div class="p-head">
            <h4>${p.name}</h4>
            <span class="p-vol">${p.vol}</span>
          </div>
          <p class="p-desc">${p.desc}</p>
          <div class="p-foot">
            <div class="p-price">${money(p.price)}</div>
            <button class="add-btn" data-add="${p.id}">
              <span>+ В корзину</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // Trigger reveal observer
    initReveal();
  }

  // Category filter click
  const filtersWrap = $('#filtersWrap');
  if (filtersWrap) {
    filtersWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCatalog(btn.dataset.filter);
    });
  }

  // --- Cart State & Persistence ---
  let cart = {};
  try {
    cart = JSON.parse(localStorage.getItem('tsar_cart') || '{}');
  } catch (e) {
    cart = {};
  }

  const saveCart = () => {
    try {
      localStorage.setItem('tsar_cart', JSON.stringify(cart));
    } catch (e) {}
  };

  const getCartLines = () => {
    return Object.keys(cart)
      .map(id => ({ product: PRODUCTS.find(p => p.id == id), qty: cart[id] }))
      .filter(line => line.product && line.qty > 0);
  };

  const getCartTotal = () => {
    return getCartLines().reduce((sum, line) => sum + line.product.price * line.qty, 0);
  };

  const getCartCount = () => {
    return getCartLines().reduce((sum, line) => sum + line.qty, 0);
  };

  // Toast notification
  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // --- Render Cart Drawer ---
  function updateCartUI() {
    const lines = getCartLines();
    const count = getCartCount();
    const total = getCartTotal();

    // Badge
    const badge = $('#cartCount');
    if (badge) badge.textContent = count;

    // Total in drawer
    const totalEl = $('#cartTotalSum');
    if (totalEl) totalEl.textContent = money(total);

    // Free delivery progress
    const freeTarget = CONFIG.freeDeliveryFrom;
    const freeBar = $('#freeDeliveryBar');
    const freeTxt = $('#freeDeliveryText');

    if (freeBar && freeTxt) {
      if (freeTarget > 0) {
        const pct = Math.min(100, (total / freeTarget) * 100);
        freeBar.style.width = pct + '%';
        if (total >= freeTarget) {
          freeTxt.innerHTML = '🎉 Бесплатная доставка активна!';
          freeTxt.style.color = '#38e872';
        } else {
          freeTxt.innerHTML = `До бесплатной доставки осталось <b>${money(freeTarget - total)}</b>`;
          freeTxt.style.color = '';
        }
      }
    }

    // Items list
    const itemsContainer = $('#cartItemsList');
    if (itemsContainer) {
      if (!lines.length) {
        itemsContainer.innerHTML = `
          <div class="empty-cart">
            <i>🥒</i>
            <p>Ваша корзина пока пуста.<br>Добавьте фирменные огурцы из каталога!</p>
          </div>
        `;
      } else {
        itemsContainer.innerHTML = lines.map(line => `
          <div class="cart-item">
            <div>
              <div class="cart-item-title">${line.product.name}</div>
              <div class="cart-item-meta">${line.product.vol} · ${money(line.product.price)}</div>
              <div class="qty-control">
                <button class="qty-btn" data-minus="${line.product.id}" aria-label="Меньше">−</button>
                <span><b>${line.qty}</b> шт.</span>
                <button class="qty-btn" data-plus="${line.product.id}" aria-label="Больше">+</button>
              </div>
            </div>
            <div class="cart-item-sum">${money(line.product.price * line.qty)}</div>
          </div>
        `).join('');
      }
    }

    // Checkout button state
    const checkoutBtn = $('#btnToCheckout');
    if (checkoutBtn) {
      checkoutBtn.disabled = !lines.length;
      checkoutBtn.style.opacity = lines.length ? '1' : '0.5';
    }
  }

  // --- Add to Cart & Cart Controls ---
  document.addEventListener('click', (e) => {
    // Add button
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      const id = addBtn.dataset.add;
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      updateCartUI();

      // Sound & 3D spin reaction
      if (window.playCrunch) window.playCrunch();
      if (window.spinPickle) window.spinPickle(1.5);

      // Cart button bump
      const cartBtn = $('#openCartBtn');
      if (cartBtn) {
        cartBtn.classList.remove('bump');
        void cartBtn.offsetWidth;
        cartBtn.classList.add('bump');
      }

      // Button feedback
      addBtn.classList.add('added');
      addBtn.innerHTML = '<span>✓ В корзине</span>';
      setTimeout(() => {
        addBtn.classList.remove('added');
        addBtn.innerHTML = '<span>+ В корзину</span>';
      }, 1200);

      showToast('Добавлено в корзину! 🥒');
      return;
    }

    // Spin trigger on card
    const spinBtn = e.target.closest('.p-spin-trigger');
    if (spinBtn) {
      if (window.spinPickle) window.spinPickle(2.4);
      if (window.playCrunch) window.playCrunch();
      showToast('Огурец раскручен в 3D! ✨');
      return;
    }

    // Quantity Plus
    const plusBtn = e.target.closest('[data-plus]');
    if (plusBtn) {
      const id = plusBtn.dataset.plus;
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      updateCartUI();
      if (window.playCrunch) window.playCrunch();
      return;
    }

    // Quantity Minus
    const minusBtn = e.target.closest('[data-minus]');
    if (minusBtn) {
      const id = minusBtn.dataset.minus;
      cart[id] = (cart[id] || 0) - 1;
      if (cart[id] <= 0) delete cart[id];
      saveCart();
      updateCartUI();
      return;
    }
  });

  // --- Drawer Open / Close ---
  const drawer = $('#cartDrawer');
  const shade = $('#cartShade');
  const openCartBtn = $('#openCartBtn');
  const closeCartBtn = $('#closeCartBtn');

  function toggleCart(open) {
    if (drawer) drawer.classList.toggle('open', open);
    if (shade) shade.classList.toggle('open', open);
    if (open) updateCartUI();
  }

  if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
  if (shade) shade.addEventListener('click', () => toggleCart(false));

  // --- Checkout Modal ---
  const modal = $('#checkoutModal');
  const btnToCheckout = $('#btnToCheckout');
  const closeCheckoutBtn = $('#closeCheckoutBtn');
  const deliveryTypeSelect = $('#orderDeliveryType');
  const addressWrap = $('#addressFieldWrap');

  function buildOrderText() {
    const lines = getCartLines();
    const total = getCartTotal();
    const isDelivery = deliveryTypeSelect ? deliveryTypeSelect.value === 'delivery' : true;
    const name = ($('#orderName')?.value || '').trim();
    const phone = ($('#orderPhone')?.value || '').trim();
    const addr = ($('#orderAddress')?.value || '').trim();
    const comment = ($('#orderComment')?.value || '').trim();

    let txt = `🥒 НОВЫЙ ЗАКАЗ · ${CONFIG.brand}\n`;
    txt += `────────────────────────────\n`;
    lines.forEach(l => {
      txt += `• ${l.product.name} (${l.product.vol}) × ${l.qty} шт. = ${money(l.product.price * l.qty)}\n`;
    });
    txt += `────────────────────────────\n`;
    txt += `ИТОГО К ОПЛАТЕ: ${money(total)}\n`;
    txt += `Тип: ${isDelivery ? '🚗 Доставка курьером' : '🏪 Самовывоз из погреба'}\n`;
    if (isDelivery && addr) txt += `Адрес: ${addr}\n`;
    txt += `Клиент: ${name}\n`;
    txt += `Телефон: ${phone}\n`;
    if (comment) txt += `Пожелания: ${comment}\n`;
    txt += `Дата: ${new Date().toLocaleString('ru-RU')}`;
    return txt;
  }

  function refreshOrderSummary() {
    const lines = getCartLines();
    const total = getCartTotal();
    const summaryBox = $('#orderSummaryBox');
    if (summaryBox) {
      summaryBox.textContent = lines.map(l => `${l.product.name} × ${l.qty} — ${money(l.product.price * l.qty)}`).join('\n') +
        `\n\nИтого: ${money(total)}`;
    }
    if (addressWrap && deliveryTypeSelect) {
      addressWrap.style.display = deliveryTypeSelect.value === 'delivery' ? 'grid' : 'none';
    }
  }

  if (deliveryTypeSelect) {
    deliveryTypeSelect.addEventListener('change', refreshOrderSummary);
  }

  if (btnToCheckout) {
    btnToCheckout.addEventListener('click', () => {
      toggleCart(false);
      refreshOrderSummary();
      if (modal) modal.classList.add('open');
    });
  }

  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => {
      if (modal) modal.classList.remove('open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  // Validate form
  function validateCheckout() {
    const nameEl = $('#orderName');
    const phoneEl = $('#orderPhone');
    const addrEl = $('#orderAddress');
    const isDelivery = deliveryTypeSelect ? deliveryTypeSelect.value === 'delivery' : true;

    let valid = true;
    [nameEl, phoneEl, addrEl].forEach(el => { if (el) el.style.borderColor = ''; });

    if (!nameEl || nameEl.value.trim().length < 2) {
      if (nameEl) nameEl.style.borderColor = '#ff5e62';
      valid = false;
    }
    const cleanPhone = (phoneEl?.value || '').replace(/\D/g, '');
    if (!phoneEl || cleanPhone.length < 7) {
      if (phoneEl) phoneEl.style.borderColor = '#ff5e62';
      valid = false;
    }
    if (isDelivery && (!addrEl || addrEl.value.trim().length < 4)) {
      if (addrEl) addrEl.style.borderColor = '#ff5e62';
      valid = false;
    }

    if (!valid) showToast('Пожалуйста, заполните выделенные поля');
    return valid;
  }

  function orderCompleteCleanup() {
    cart = {};
    saveCart();
    updateCartUI();
    if (modal) modal.classList.remove('open');
    if (window.playCrunch) window.playCrunch();
    showToast('Заказ принят! Спасибо за выбор Царь-Огурца 🥒');
  }

  // Submit via Telegram & Go API
  const checkoutForm = $('#checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateCheckout()) return;

      const orderPayload = {
        name: $('#orderName').value.trim(),
        phone: $('#orderPhone').value.trim(),
        address: $('#orderAddress')?.value.trim() || '',
        deliveryType: deliveryTypeSelect ? deliveryTypeSelect.value : 'delivery',
        comment: $('#orderComment')?.value.trim() || '',
        items: getCartLines().map(l => ({ id: l.product.id, name: l.product.name, qty: l.qty, price: l.product.price })),
        total: getCartTotal(),
        timestamp: new Date().toISOString()
      };

      // 1. Try sending to Go Server API (if hosted via Go server)
      try {
        fetch('/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        }).catch(() => {});
      } catch (err) {}

      // 2. Open Telegram with formatted order
      const tgText = encodeURIComponent(buildOrderText());
      window.open(`https://t.me/${CONFIG.telegram}?text=${tgText}`, '_blank');

      orderCompleteCleanup();
    });
  }

  // Copy order text button
  const copyBtn = $('#btnCopyOrder');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!validateCheckout()) return;
      const text = buildOrderText();
      try {
        await navigator.clipboard.writeText(text);
        showToast('Текст заказа скопирован в буфер обмена! 📋');
      } catch (e) {
        prompt('Скопируйте текст заказа вручную:', text);
      }
    });
  }

  // --- Sticky Header Scroll Styling ---
  const header = $('header');
  window.addEventListener('scroll', () => {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
  }, { passive: true });

  // --- Smooth Reveal Animation Observer ---
  function initReveal() {
    const items = $$('.rv:not(.in)');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach((item, idx) => {
      item.style.transitionDelay = (idx % 3) * 80 + 'ms';
      observer.observe(item);
    });
  }

  // Escape key handler
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleCart(false);
      if (modal) modal.classList.remove('open');
    }
  });

  // Delivery terms list injection
  const deliveryList = $('#deliveryTermsList');
  if (deliveryList) {
    deliveryList.innerHTML = CONFIG.deliveryTerms.map(term => `<li>${term}</li>`).join('');
  }

  // Initial Boot
  renderCatalog('all');
  updateCartUI();
  initReveal();
})();
