// ===== ADMIN GUARD =====
function checkAdminAuth() {
  if (sessionStorage.getItem('admin_logged_in') !== 'true') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function adminLogout() {
  sessionStorage.removeItem('admin_logged_in');
  sessionStorage.removeItem('admin_username');
  window.location.href = 'login.html';
}

// ===== SIDEBAR =====
function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
  document.getElementById('sidebar-mob-overlay').classList.toggle('open');
}

// ===== TOAST =====
function showToast(msg, duration = 2800) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== CONFIRM DIALOG =====
function showConfirm(title, desc, onOk) {
  const overlay = document.getElementById('confirm-dialog');
  overlay.style.display = 'flex';
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-desc').textContent = desc;
  document.getElementById('confirm-ok-btn').onclick = () => {
    overlay.style.display = 'none';
    onOk();
  };
  document.getElementById('confirm-cancel-btn').onclick = () => {
    overlay.style.display = 'none';
  };
}

// ===== FORMAT HELPERS =====
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function discountedPrice(original, percent) {
  return original - (original * percent / 100);
}

// ===== LOAD SETTINGS (for topbar branding) =====
async function loadAdminBranding() {
  const { data } = await supabase.from('site_settings').select('*');
  if (!data) return {};
  const s = {};
  data.forEach(row => s[row.key] = row.value);
  // Update sidebar
  const nameEl = document.getElementById('sidebar-site-name');
  const logoEl = document.getElementById('sidebar-logo');
  if (nameEl && s.site_name) nameEl.textContent = s.site_name;
  if (logoEl && s.site_name) logoEl.textContent = s.site_name.charAt(0);
  return s;
}

// ===== UPLOAD IMAGE TO SUPABASE STORAGE (Base64 fallback) =====
// Since we may not have storage bucket, we allow URL input or base64
async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error('Read failed'));
    r.readAsDataURL(file);
  });
}

// Upload to Supabase Storage
async function uploadImageFile(file, bucket = 'products') {
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: true });
  if (error) return null;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  return urlData?.publicUrl || null;
}
