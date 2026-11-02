
document.addEventListener('DOMContentLoaded', () => {
  // =========================================
  // H100 ARCHIVE - Main Application
  // =========================================

  const SUPABASE_URL = 'https://srcdhvfhikxignvmuhha.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_WWUjfhvOMvIeoRJbo9y59Q_EnaS_UCY';
  const TABLE_URL = `${SUPABASE_URL}/rest/v1/archive_items`;
  const LOCAL_KEY = 'h100_archive_items';

  // HTML elements
  const form = document.getElementById('form');
  const titleInput = document.getElementById('title');
  const detailsInput = document.getElementById('details');
  const sourceInput = document.getElementById('source');
  const dateInput = document.getElementById('date');
  const categoryInput = document.getElementById('category');
  const imageInput = document.getElementById('image_url');
  const list = document.getElementById('list');
  const search = document.getElementById('search');

  const menuButton = document.querySelector('.menu-btn');
  const nav = document.querySelector('nav');
  const year = document.getElementById('year');
  const backToTop = document.getElementById('backToTop');

  let items = [];
  let remoteConnected = false;

  // =========================================
  // General functions
  // =========================================

  if (year) {
    year.textContent = new Date().getFullYear();
  }

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
      backToTop.style.display =
        window.scrollY > 300 ? 'block' : 'none';
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  if (!form || !titleInput || !detailsInput || !list || !search) {
    console.error('H100: بعض عناصر HTML المطلوبة غير موجودة.');
    return;
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

  function safeURL(value) {
    if (!value) return '';

    try {
      const url = new URL(value);

      if (url.protocol === 'https:' || url.protocol === 'http:') {
        return escapeHTML(url.href);
      }
    } catch (error) {
      return '';
    }

    return '';
  }

  function getLocalItems() {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) return [];

      return parsed.map(item => ({
        id: item.id || null,
        title: item.title || '',
        content: item.content || item.details || '',
        category: item.category || 'عام',
        source_url: item.source_url || item.source || '',
        image_url: item.image_url || '',
        created_at: item.created_at || item.date || '',
        localOnly: true
      }));
    } catch (error) {
      console.error('H100 local storage error:', error);
      return [];
    }
  }

  function saveLocalItem(item) {
    try {
      const saved = getLocalItems();

      const duplicate = saved.some(old =>
        old.title === item.title &&
        old.content === item.content &&
        old.created_at === item.created_at
      );

      if (!duplicate) {
        saved.unshift(item);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(saved));
      }

      return true;
    } catch (error) {
      console.error('H100 local save error:', error);
      return false;
    }
  }

  function mergeItems(remoteItems, localItems) {
    const result = [...remoteItems];

    localItems.forEach(local => {
      const exists = result.some(remote =>
        remote.id && local.id && remote.id === local.id
      ) || result.some(remote =>
        remote.title === local.title &&
        remote.content === local.content &&
        remote.created_at === local.created_at
      );

      if (!exists) {
        result.push(local);
      }
    });

    return result;
  }

  // =========================================
  // Supabase connection
  // =========================================

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

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${
          responseText || 'استجابة فارغة من الخادم'
        }`
      );
    }

    if (!responseText.trim()) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch (error) {
      throw new Error('استجابة الخادم ليست بصيغة JSON صحيحة.');
    }
  }

  // =========================================
  // Display archive items
  // =========================================

  function render() {
    const query = search.value.trim().toLowerCase();

    const filtered = items.filter(item => {
      const text = [
        item.title,
        item.content,
        item.category
      ].join(' ').toLowerCase();

      return text.includes(query);
    });

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

      const sourceURL = safeURL(item.source_url);
      const imageURL = safeURL(item.image_url);

      const source = sourceURL
        ? `<p><a href="${sourceURL}" target="_blank" rel="noopener noreferrer">🔗 فتح المصدر</a></p>`
        : '';

      const image = imageURL
        ? `<p><a href="${imageURL}" target="_blank" rel="noopener noreferrer">🖼️ عرض الصورة</a></p>`
        : '';

      const localLabel = item.localOnly
        ? '<span> · محفوظ على هذا الجهاز فقط</span>'
        : '';

      card.innerHTML = `
        <h3>${escapeHTML(item.title)}</h3>

        <div class="meta">
          ${escapeHTML(item.category || 'عام')}
          ${date ? ' · 📅 ' + escapeHTML(date) : ''}
          ${localLabel}
        </div>

        <div>
          ${escapeHTML(item.content).replace(/\n/g, '<br>')}
        </div>

        ${source}
        ${image}
      `;

      list.appendChild(card);
    });
  }

  // =========================================
  // Load saved items
  // =========================================

  async function loadItems() {
    list.textContent = 'جارٍ تحميل التوثيقات...';

    const localItems = getLocalItems();

    try {
      const remoteItems = await request(
        '?select=id,title,content,category,source_url,image_url,created_at&order=created_at.desc'
      );

      if (!Array.isArray(remoteItems)) {
        throw new Error('صيغة بيانات الأرشيف غير صحيحة.');
      }

      remoteConnected = true;
      items = mergeItems(remoteItems, localItems);
      render();

    } catch (error) {
      remoteConnected = false;
      console.error('H100 load error:', error);

      items = localItems;
      render();

      if (!localItems.length) {
        list.textContent =
          'تعذر الاتصال بالأرشيف. تحقق من الإنترنت وصلاحيات Supabase.';
      }
    }
  }

  // =========================================
  // Save new documentation
  // =========================================

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = detailsInput.value.trim();

    if (!title || !content) {
      alert('اكتب عنوان التوثيق والتفاصيل أولاً.');
      return;
    }

    const item = {
      title: title,
      content: content,
      category: categoryInput?.value.trim() || 'عام',
      source_url: sourceInput?.value.trim() || null,
      image_url: imageInput?.value.trim() || null
    };

    if (dateInput?.value) {
      item.created_at = new Date(
        dateInput.value + 'T12:00:00Z'
      ).toISOString();
    } else {
      item.created_at = new Date().toISOString();
    }

    const submitButton = form.querySelector(
      'button[type="submit"], button:not([type])'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'جارٍ الحفظ...';
    }

    try {
      await request('', {
        method: 'POST',
        headers: {
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(item)
      });

      form.reset();

      await loadItems();

      alert('تم إرسال التوثيق إلى أرشيف H100 بنجاح.');

    } catch (error) {
      console.error('H100 save error:', error);

      const localSaved = saveLocalItem(item);

      if (localSaved) {
        form.reset();
        await loadItems();

        alert(
          'تعذر الحفظ في قاعدة البيانات.\n' +
          'تم الاحتفاظ بالتوثيق على هذا الجهاز فقط.\n\n' +
          error.message
        );
      } else {
        alert('فشل الحفظ. احتفظ بنسخة من النص قبل إغلاق الصفحة.\n' +
          error.message);
      }

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'إضافة توثيق';
      }
    }
  });

  // =========================================
  // Search
  // =========================================

  search.addEventListener('input', render);

  // Start application
  loadItems();
});
