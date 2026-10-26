
document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://srcdhvfhikxignvmuhha.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_WWUjfhvOMvIeoRJbo9y59Q_EnaS_UCY';
  const TABLE_URL = `${SUPABASE_URL}/rest/v1/archive_items`;

  const form = document.getElementById('form');
  const titleInput = document.getElementById('title');
  const detailsInput = document.getElementById('details');
  const sourceInput = document.getElementById('source');
  const dateInput = document.getElementById('date');
  const list = document.getElementById('list');
  const search = document.getElementById('search');
  const categoryInput = document.getElementById('category');
  const imageInput = document.getElementById('image_url');

  const menuButton = document.querySelector('.menu-btn');
  const nav = document.querySelector('nav');
  const year = document.getElementById('year');
  const backToTop = document.getElementById('backToTop');

  if (year) year.textContent = new Date().getFullYear();

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
      });
    });
  }

  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (!form || !titleInput || !detailsInput || !list || !search) {
    console.error('H100: required HTML elements are missing.');
    return;
  }

  let items = [];

  async function request(path = '', options = {}) {
    const response = await fetch(TABLE_URL + path, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`HTTP ${response.status}: ${message}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function render() {
    const query = search.value.trim().toLowerCase();

    const filtered = items.filter(item =>
      `${item.title || ''} ${item.content || ''} ${item.category || ''}`
        .toLowerCase().includes(query)
    );

    list.innerHTML = '';

    if (!filtered.length) {
      list.textContent = 'لا توجد توثيقات تطابق البحث.';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('article');
      card.className = 'item';

      const date = item.created_at
        ? new Date(item.created_at).toLocaleDateString('ar')
        : '';

      const source = item.source_url
        ? `<p><a href="${escapeHTML(item.source_url)}" target="_blank" rel="noopener noreferrer">🔗 فتح المصدر</a></p>`
        : '';

      const image = item.image_url
        ? `<p><a href="${escapeHTML(item.image_url)}" target="_blank" rel="noopener noreferrer">عرض الصورة</a></p>`
        : '';

      card.innerHTML = `
        <h3>${escapeHTML(item.title)}</h3>
        <div class="meta">
          ${escapeHTML(item.category || 'عام')}
          ${date ? ' · 📅 ' + escapeHTML(date) : ''}
        </div>
        <div>${escapeHTML(item.content).replace(/\n/g, '<br>')}</div>
        ${source}
        ${image}
      `;

      list.appendChild(card);
    });
  }

  async function loadItems() {
    list.textContent = 'جارٍ تحميل التوثيقات...';

    try {
      items = await request(
        '?select=id,title,content,category,source_url,image_url,created_at&order=created_at.desc'
      );
      render();
    } catch (error) {
      console.error('H100 load error:', error);
      list.textContent = 'تعذر تحميل التوثيقات. تحقق من الاتصال وصلاحيات قاعدة البيانات.';
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = detailsInput.value.trim();

    if (!title || !content) {
      alert('اكتب عنوان التوثيق والتفاصيل أولاً.');
      return;
    }

    const item = {
      title,
      content,
      category: categoryInput?.value.trim() || 'عام',
      source_url: sourceInput?.value.trim() || null,
      image_url: imageInput?.value.trim() || null
    };

    if (dateInput?.value) {
      item.created_at = new Date(
        dateInput.value + 'T12:00:00Z'
      ).toISOString();
    }

    const submitButton = form.querySelector(
      'button[type="submit"], button:not([type])'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      await request('', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(item)
      });

      form.reset();
      await loadItems();
      alert('تم حفظ التوثيق في H100 Archive بنجاح.');
    } catch (error) {
      console.error('H100 save error:', error);
      alert('فشل الحفظ:\n' + error.message);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  search.addEventListener('input', render);
  loadItems();
});
