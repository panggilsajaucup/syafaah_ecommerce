const SUPABASE_URL = 'https://wrwvnndslnfresgpfviy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyd3ZubmRzbG5mcmVzZ3BmdnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0NTcxNDcwMywiZXhwIjoyMDYxMjkwNzAzfQ.eLiAiJCNHgPzHEzKT5KBbEJhpijQXHiLFkpGjHIoIEc';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper: format currency IDR
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

// Helper: discounted price
function discountedPrice(original, percent) {
  return original - (original * percent / 100);
}

// Helper: time greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Pagi';
  if (hour >= 12 && hour < 15) return 'Siang';
  if (hour >= 15 && hour < 19) return 'Sore';
  return 'Malam';
}

// Cart (localStorage)
const Cart = {
  get() {
    return JSON.parse(localStorage.getItem('syafaah_cart') || '[]');
  },
  save(cart) {
    localStorage.setItem('syafaah_cart', JSON.stringify(cart));
    Cart.updateBadge();
  },
  add(item) {
    const cart = Cart.get();
    const existing = cart.find(c => c.variantId === item.variantId && c.size === item.size);
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      cart.push({ ...item, qty: item.qty || 1 });
    }
    Cart.save(cart);
  },
  remove(index) {
    const cart = Cart.get();
    cart.splice(index, 1);
    Cart.save(cart);
  },
  updateQty(index, qty) {
    const cart = Cart.get();
    if (qty <= 0) { Cart.remove(index); return; }
    cart[index].qty = qty;
    Cart.save(cart);
  },
  total() {
    return Cart.get().reduce((sum, i) => sum + (i.finalPrice * i.qty), 0);
  },
  count() {
    return Cart.get().reduce((sum, i) => sum + i.qty, 0);
  },
  updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = Cart.count();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
};

// Load site settings
async function loadSiteSettings() {
  const { data } = await supabase.from('site_settings').select('*');
  const settings = {};
  if (data) data.forEach(row => settings[row.key] = row.value);
  return settings;
}
