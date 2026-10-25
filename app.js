
document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'h100_archive_items';

  const form = document.getElementById('form');
  const titleInput = document.getElementById('title');
  const detailsInput = document.getElementById('details');
  const sourceInput = document.getElementById('source');
  const dateInput = document.getElementById('date');
  const list = document.getElementById('list');
  const search = document.getElementById('search');

  if (!form || !titleInput || !detailsInput || !list || !search) {
    alert('خطأ: بعض عناصر الصفحة غير موجودة.');
    return;
  }

  function getItems() {
    try {
      const items = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
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

    const items = getItems().filter(item =>
      `${item.title} ${item.details}`.toLowerCase().includes(query)
    );

    list.innerHTML = '';

    if (items.length === 0) {
      list.textContent = 'لا توجد توثيقات محفوظة تطابق البحث.';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('article');
      card.className = 'item';

      card.innerHTML = `
        <h3>${escapeHTML(item.title)}</h3>
        <div class="meta">📅 ${escapeHTML(item.date)}</div>
        <div>${escapeHTML(item.details).replace(/\n/g, '<br>')}</div>
        ${item.source
          ? `<p><a href="${escapeHTML(item.source)}"
               target="_blank" rel="noopener">🔗 فتح المصدر</a></p>`
          : ''}
        <button type="button" data-delete="${escapeHTML(item.id)}">
          حذف
        </button>
      `;

      list.appendChild(card);
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    try {
      const title = titleInput.value.trim();
      const details = detailsInput.value.trim();

      if (!title || !details) {
        alert('اكتب عنوان التوثيق والتفاصيل أولاً.');
        return;
      }

      const item = {
        id: Date.now().toString(),
        title,
        details,
        source: sourceInput ? sourceInput.value.trim() : '',
        date: dateInput && dateInput.value
          ? dateInput.value
          : new Date().toISOString().slice(0, 10)
      };

      const items = getItems();
      items.unshift(item);

      localStorage.setItem(KEY, JSON.stringify(items));
      render();
      alert('تم حفظ التوثيق على هذا الجهاز بنجاح ✅');
      form.reset();
    } catch (error) {
      console.error('H100 save error:', error);
      alert('تعذر الحفظ. تحقق من مساحة التخزين ثم حاول مرة أخرى.');
    }
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;

    const id = button.dataset.delete;
    const remaining = getItems().filter(item => item.id !== id);

    localStorage.setItem(KEY, JSON.stringify(remaining));
    render();
  });

  search.addEventListener('input', render);
  render();
});
