// ===== STATE =====
let allProducts = [];
let allVariants = [];
let allSizeGuides = [];
let siteSettings = {};
let currentCategory = 'all';
let searchQuery = '';
let currentProduct = null;
let currentVariant = null;
let currentSize = null;
let csNumber = '6281234567890';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  Cart.updateBadge();
  await Promise.all([loadSettings(), loadProducts()]);
  setupSearch();
  setupScrollEffect();
  observeFadeElements();
});

// ===== LOAD SETTINGS =====
async function loadSettings() {
  const { data } = await supabase.from('site_settings').select('*');
  if (!data) return;
  data.forEach(row => siteSettings[row.key] = row.value);

  const siteName = siteSettings.site_name || "Syafa'ah Muslim Wear";
  const tagline = siteSettings.tagline || 'Premium Quality Product';
  csNumber = siteSettings.whatsapp_number || '6281234567890';

  document.title = `${siteName} – ${tagline}`;
  document.getElementById('nav-site-name').textContent = siteName;
  document.getElementById('nav-tagline').textContent = tagline;
  document.getElementById('nav-logo-char').textContent = siteName.charAt(0);
  document.getElementById('footer-site-name').textContent = siteName;
  document.getElementById('footer-logo-char').textContent = siteName.charAt(0);
  document.getElementById('footer-tagline-text').textContent = `Menyediakan busana muslim premium berkualitas tinggi untuk ibadah dan keseharian Anda.`;
  document.getElementById('footer-copyright').textContent = `© 2025 ${siteName}. All rights reserved.`;
  document.getElementById('footer-wa-link').href = `https://wa.me/${csNumber}`;
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  const [prodRes, varRes, sizeRes] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('product_variants').select('*'),
    supabase.from('size_guides').select('*').order('sort_order')
  ]);

  allProducts = prodRes.data || [];
  allVariants = varRes.data || [];
  allSizeGuides = sizeRes.data || [];

  updateCounts();
  renderProducts(allProducts);
  document.getElementById('stat-products').textContent = allProducts.length + '+';
}

// ===== COUNTS PER CATEGORY =====
function updateCounts() {
  const cats = ['Mukena Anak', 'Mukena Dewasa', 'Gamis', 'Hijab', 'Koko Pria', 'Sarung'];
  document.getElementById('count-all').textContent = `${allProducts.length} produk`;
  cats.forEach(cat => {
    const count = allProducts.filter(p => p.category === cat).length;
    const id = `count-${cat.toLowerCase().replace(/ /g, '-').replace('koko-pria','koko')}`;
    const el = document.getElementById(id);
    if (el) el.textContent = `${count} produk`;
  });
}

// ===== FILTER CATEGORY =====
function filterCategory(cat, el) {
  currentCategory = cat;
  // Update active state on category cards
  document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    // find by data-cat
    document.querySelector(`[data-cat="${cat}"]`)?.classList.add('active');
    scrollToCatalog();
  }
  applyFilters();
}

// ===== SEARCH =====
function setupSearch() {
  const inputs = [document.getElementById('search-input'), document.getElementById('mobile-search-input')];
  inputs.forEach(inp => {
    if (!inp) return;
    inp.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      // sync both
      inputs.forEach(i => { if (i && i !== e.target) i.value = e.target.value; });
      applyFilters();
    });
  });
}

// ===== APPLY FILTERS =====
function applyFilters() {
  let filtered = allProducts;
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }
  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery) ||
      (p.description || '').toLowerCase().includes(searchQuery)
    );
  }
  renderProducts(filtered);
}

// ===== RENDER PRODUCTS =====
function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  document.getElementById('shown-count').textContent = products.length;

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state"><span>🔍</span><p>Tidak ada produk ditemukan</p></div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const variants = allVariants.filter(v => v.product_id === p.id);
    const firstVariant = variants[0];
    const price = firstVariant ? firstVariant.original_price : 0;
    const disc = firstVariant ? firstVariant.discount_percent : 0;
    const finalPrice = discountedPrice(price, disc);

    const imgSrc = firstVariant?.photo_url;
    const imgTag = imgSrc
      ? `<img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\'product-placeholder\'><span>🧕</span><p>No Image</p></div>'">`
      : `<div class="product-placeholder"><span>${categoryIcon(p.category)}</span><p>No Image</p></div>`;

    const variantDots = variants.slice(0, 4).map((v, i) =>
      v.photo_url
        ? `<div class="variant-dot"><img src="${v.photo_url}" alt="${v.name}" onerror="this.style.display='none'"></div>`
        : ''
    ).join('');
    const moreCount = variants.length > 4 ? `<div class="variant-dot variant-more">+${variants.length - 4}</div>` : '';

    return `
    <div class="product-card fade-up" onclick="openProduct(${p.id})">
      <div class="product-image">
        ${imgTag}
        ${p.is_best_seller ? '<div class="badge-bestseller">⭐ Best Seller</div>' : ''}
        ${disc > 0 ? `<div class="badge-discount">-${Math.round(disc)}%</div>` : ''}
      </div>
      <div class="product-body">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-pricing">
          ${disc > 0 ? `
            <div>
              <span class="price-original">${formatRupiah(price)}</span>
              <span class="price-discount">-${Math.round(disc)}%</span>
            </div>
            <span class="price-final">${formatRupiah(finalPrice)}</span>
          ` : `
            <span class="price-final">${formatRupiah(price)}</span>
          `}
        </div>
        ${variants.length > 0 ? `
        <div class="product-variants-preview">
          ${variantDots}${moreCount}
        </div>` : ''}
        <button class="btn-view" onclick="openProduct(${p.id});event.stopPropagation();">
          👁️ Lihat Detail
        </button>
      </div>
    </div>`;
  }).join('');

  // Trigger fade-up
  setTimeout(() => {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
  }, 50);
}

function categoryIcon(cat) {
  const icons = { 'Mukena Anak': '👧', 'Mukena Dewasa': '🧕', 'Gamis': '👗', 'Hijab': '🧣', 'Koko Pria': '👔', 'Sarung': '🧶' };
  return icons[cat] || '👘';
}

// ===== OPEN PRODUCT MODAL =====
function openProduct(productId) {
  currentProduct = allProducts.find(p => p.id === productId);
  if (!currentProduct) return;

  const variants = allVariants.filter(v => v.product_id === productId);
  const sizeGuides = allSizeGuides.filter(s => s.product_id === productId);

  currentVariant = variants[0] || null;
  currentSize = null;

  renderModal(currentProduct, variants, sizeGuides);
  document.getElementById('product-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('product-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// Click outside modal
document.getElementById('product-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ===== RENDER MODAL =====
function renderModal(product, variants, sizeGuides) {
  const body = document.getElementById('modal-body');
  const v = variants[0];
  const price = v ? v.original_price : 0;
  const disc = v ? v.discount_percent : 0;
  const finalPrice = discountedPrice(price, disc);

  const sizeTableHTML = buildSizeTable(product.category, sizeGuides);
  const sizesHTML = buildSizesSelector(product.available_sizes || []);

  body.innerHTML = `
  <div class="modal-grid">
    <div class="modal-images">
      <div class="modal-main-image" id="modal-main-img">
        ${v?.photo_url
          ? `<img src="${v.photo_url}" alt="${product.name}" id="modal-hero-img" onerror="this.parentElement.innerHTML='<div style=\'display:flex;align-items:center;justify-content:center;height:100%;font-size:64px;opacity:.3\'>${categoryIcon(product.category)}</div>'">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:64px;opacity:.3">${categoryIcon(product.category)}</div>`}
      </div>
      <div class="modal-thumbnails" id="modal-thumbs">
        ${variants.map((vt, i) => `
          <div class="modal-thumb ${i === 0 ? 'active' : ''}" onclick="selectVariantFromThumb(${vt.id}, this)" data-variant-id="${vt.id}">
            ${vt.photo_url
              ? `<img src="${vt.photo_url}" alt="${vt.name}">`
              : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:20px;opacity:.4">${categoryIcon(product.category)}</div>`}
          </div>`).join('')}
      </div>
    </div>

    <div class="modal-info">
      <div class="modal-product-category">${product.category}</div>
      <div class="modal-product-name">${product.name}</div>

      <div class="modal-pricing" id="modal-pricing">
        ${renderPricing(price, disc, finalPrice)}
      </div>

      ${variants.length > 0 ? `
      <div class="modal-section-title">Pilih Varian</div>
      <div class="variants-selector" id="variants-selector">
        ${variants.map((vt, i) => `
          <button class="variant-btn ${i === 0 ? 'active' : ''}" onclick="selectVariant(${vt.id}, this)" data-variant-id="${vt.id}">
            ${vt.photo_url ? `<img src="${vt.photo_url}" alt="${vt.name}">` : ''}
            ${vt.name}
          </button>`).join('')}
      </div>` : ''}

      ${sizesHTML ? `
      <div class="modal-section-title">Pilih Ukuran</div>
      <div class="sizes-selector" id="sizes-selector">
        ${sizesHTML}
      </div>` : ''}

      ${sizeTableHTML ? `
      <div class="modal-section-title">Panduan Ukuran</div>
      <div class="size-table-wrapper">${sizeTableHTML}</div>
      ` : ''}

      ${product.description ? `
      <div class="modal-section-title">Deskripsi Produk</div>
      <div class="modal-description">${product.description}</div>
      ` : ''}

      <div class="modal-actions">
        <button class="btn-add-cart" onclick="addToCartFromModal()">
          🛒 Tambah ke Keranjang
        </button>
        <button class="btn-wa" onclick="askWA()">
          💬 Tanya CS
        </button>
      </div>
    </div>
  </div>`;
}

function renderPricing(price, disc, finalPrice) {
  if (disc > 0) {
    return `
      <div><span class="modal-price-original">${formatRupiah(price)}</span><span class="modal-price-discount">-${Math.round(disc)}%</span></div>
      <div class="modal-price-final">${formatRupiah(finalPrice)}</div>`;
  }
  return `<div class="modal-price-final">${formatRupiah(price)}</div>`;
}

// ===== SELECT VARIANT =====
function selectVariant(variantId, btn) {
  const variants = allVariants.filter(v => v.product_id === currentProduct.id);
  currentVariant = variants.find(v => v.id === variantId);
  if (!currentVariant) return;

  // Update active state
  document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Update thumbnail active
  document.querySelectorAll('.modal-thumb').forEach(t => {
    t.classList.toggle('active', parseInt(t.dataset.variantId) === variantId);
  });

  // Update main image
  const heroImg = document.getElementById('modal-hero-img');
  if (heroImg && currentVariant.photo_url) heroImg.src = currentVariant.photo_url;

  // Update pricing
  const price = currentVariant.original_price;
  const disc = currentVariant.discount_percent;
  const final = discountedPrice(price, disc);
  document.getElementById('modal-pricing').innerHTML = renderPricing(price, disc, final);
}

function selectVariantFromThumb(variantId, thumbEl) {
  const btn = document.querySelector(`.variant-btn[data-variant-id="${variantId}"]`);
  if (btn) selectVariant(variantId, btn);
}

// ===== SIZE SELECTOR =====
function buildSizesSelector(sizes) {
  if (!sizes || sizes.length === 0) return '';
  return sizes.map(s => `
    <button class="size-btn" onclick="selectSize('${s}', this)">${s}</button>
  `).join('');
}

function selectSize(size, btn) {
  currentSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ===== SIZE TABLE PER CATEGORY =====
function buildSizeTable(category, guides) {
  if (!guides || guides.length === 0) return '';

  const headerMap = {
    'Mukena Anak': ['Ukuran', 'Tinggi (cm)', 'Lebar (cm)', 'Untuk Usia'],
    'Mukena Dewasa': ['Ukuran', 'Tinggi (cm)', 'Lebar (cm)', 'Untuk BB (kg)'],
    'Gamis': ['Ukuran', 'Tinggi (cm)', 'Lebar Dada (cm)', 'Lebar Lengan (cm)', 'Panjang Lengan (cm)', 'Untuk BB (kg)'],
    'Hijab': ['Ukuran', 'Panjang (cm)', 'Lebar Bawah (cm)', 'Diameter Muka (cm)'],
    'Koko Pria': ['Ukuran', 'Panjang Badan (cm)', 'Lebar Dada (cm)', 'Lebar Lengan (cm)', 'Panjang Lengan (cm)'],
    'Sarung': ['Ukuran', 'Tinggi (cm)', 'Lebar (cm)'],
  };

  const headers = headerMap[category];
  if (!headers) return '';

  const rows = guides.map(g => {
    const d = g.data || {};
    const cells = headers.slice(1).map(h => `<td>${d[h] || '-'}</td>`).join('');
    return `<tr><td><strong>${g.size_label}</strong></td>${cells}</tr>`;
  }).join('');

  return `
    <table class="size-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ===== ADD TO CART =====
function addToCartFromModal() {
  if (!currentProduct || !currentVariant) {
    showToast('⚠️ Pilih varian terlebih dahulu');
    return;
  }
  const sizes = currentProduct.available_sizes || [];
  if (sizes.length > 0 && !currentSize) {
    showToast('⚠️ Pilih ukuran terlebih dahulu');
    return;
  }
  const price = currentVariant.original_price;
  const disc = currentVariant.discount_percent;
  const finalPrice = discountedPrice(price, disc);

  Cart.add({
    productId: currentProduct.id,
    variantId: currentVariant.id,
    productName: currentProduct.name,
    variantName: currentVariant.name,
    size: currentSize,
    originalPrice: price,
    discount: disc,
    finalPrice,
    imageUrl: currentVariant.photo_url || '',
  });

  showToast('✅ Ditambahkan ke keranjang!');
  closeModal();
  openCart();
}

// ===== WHATSAPP ASK =====
function askWA() {
  const productName = currentProduct ? currentProduct.name : 'produk ini';
  const greeting = getGreeting();
  const msg = `Selamat ${greeting}, Saya ingin menanyakan terkait ${productName}`;
  window.open(`https://wa.me/${csNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== CART SIDEBAR =====
function openCart() {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartItems();
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartItems() {
  const items = Cart.get();
  const listEl = document.getElementById('cart-items-list');
  const totalEl = document.getElementById('cart-total-display');

  if (!items.length) {
    listEl.innerHTML = `<div class="cart-empty"><span>🛒</span><p>Keranjang masih kosong</p></div>`;
    totalEl.textContent = formatRupiah(0);
    return;
  }

  listEl.innerHTML = items.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.imageUrl
          ? `<img src="${item.imageUrl}" alt="${item.productName}" onerror="this.style.display='none'">`
          : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;opacity:.4">👘</div>'}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.productName}</div>
        <div class="cart-item-variant">${item.variantName}${item.size ? ' · ' + item.size : ''}</div>
        <div class="cart-item-controls">
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
          </div>
          <div class="cart-item-price">${formatRupiah(item.finalPrice * item.qty)}</div>
        </div>
      </div>
    </div>`).join('');

  totalEl.textContent = formatRupiah(Cart.total());
}

function changeQty(idx, delta) {
  const cart = Cart.get();
  const newQty = (cart[idx]?.qty || 1) + delta;
  Cart.updateQty(idx, newQty);
  renderCartItems();
}

// ===== CHECKOUT VIA WA =====
function checkoutWhatsapp() {
  const items = Cart.get();
  if (!items.length) { showToast('⚠️ Keranjang kosong'); return; }

  const greeting = getGreeting();
  let msg = `Selamat ${greeting}, saya ingin memesan:\n\n`;
  items.forEach((item, i) => {
    msg += `${i+1}. ${item.productName} - ${item.variantName}${item.size ? ' ('+item.size+')' : ''} x${item.qty} = ${formatRupiah(item.finalPrice * item.qty)}\n`;
  });
  msg += `\nTotal: ${formatRupiah(Cart.total())}`;
  window.open(`https://wa.me/${csNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== SCROLL =====
function scrollToCatalog() {
  document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
}

function setupScrollEffect() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ===== MOBILE MENU =====
function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// ===== TOAST =====
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== FADE OBSERVER =====
function observeFadeElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}
