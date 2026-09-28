initPage('categories', async (user, view) => {
  async function load() {
    view.innerHTML = spinnerCard();
    let data;
    try { data = (await api('/categories')).data; }
    catch (e) { view.innerHTML = errorState(e.message); return; }

    view.innerHTML =
      '<div class="section-head"><h2>Your Categories</h2><button class="btn primary" id="addBtn">+ Add Category</button></div>' +
      (data.length ? '<div class="grid g-3">' + data.map(c =>
        '<div class="card pad"><div class="row" style="justify-content:space-between">' +
          '<div class="row"><span style="font-size:26px">' + escapeHtml(c.icon) + '</span><div><strong>' + escapeHtml(c.name) + '</strong>' +
          '<div><span class="badge gray">' + c.type + '</span></div></div></div></div>' +
          (c.description ? '<p class="muted" style="margin:10px 0 0;font-size:13px">' + escapeHtml(c.description) + '</p>' : '') +
          '<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="icon-btn" data-edit="' + c._id + '">✏️</button><button class="icon-btn" data-del="' + c._id + '">🗑️</button></div>' +
        '</div>').join('') + '</div>'
      : '<div class="card pad">' + emptyState('No categories yet. Create your first one!', '🏷️') + '</div>');

    document.getElementById('addBtn').onclick = () => openForm(null);
    view.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(data.find(c => c._id === b.dataset.edit)));
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const c = data.find(x => x._id === b.dataset.del);
      if (!(await confirmDialog('Delete category "' + c.name + '"?'))) return;
      try { await api('/categories/' + c._id, { method: 'DELETE' }); toast('Category deleted'); load(); }
      catch (e) { toast(e.message, 'error'); }
    });
  }

  function openForm(existing) {
    const c = existing || {};
    const body =
      '<div class="form-grid">' +
        '<div class="field"><label>Name</label><input name="name" value="' + escapeHtml(c.name || '') + '" required></div>' +
        '<div class="field"><label>Icon (emoji)</label><input name="icon" maxlength="4" value="' + escapeHtml(c.icon || '💰') + '"></div>' +
      '</div>' +
      '<div class="field"><label>Type</label><select name="type">' + selectOptions([['expense', 'Expense'], ['income', 'Income'], ['both', 'Both']], c.type || 'expense') + '</select></div>' +
      '<div class="field"><label>Description (optional)</label><input name="description" value="' + escapeHtml(c.description || '') + '"></div>';
    openModal((existing ? 'Edit' : 'Add') + ' Category', body, {
      submitText: existing ? 'Update' : 'Create',
      onSubmit: async (data, { close, setError }) => {
        if (!data.name.trim()) return setError('Name is required');
        if (existing) { await api('/categories/' + existing._id, { method: 'PUT', body: data }); toast('Category updated'); }
        else { await api('/categories', { method: 'POST', body: data }); toast('Category created'); }
        close(); load();
      }
    });
  }
  load();
});
