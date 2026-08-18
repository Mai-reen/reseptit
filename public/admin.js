// public/admin.js
document.addEventListener('DOMContentLoaded', () => {
  const recipesList = document.getElementById('recipesList');

  async function loadRecipes() {
    try {
      const res = await fetch('/api/recipes');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Virhe haettaessa' }));
        if (recipesList) recipesList.innerHTML = `<p style="color:#d87093">${err.error || 'Ei reseptejä'}</p>`;
        return;
      }
      const recipes = await res.json();
      if (!Array.isArray(recipes) || recipes.length === 0) {
        if (recipesList) recipesList.innerHTML = '<p>Ei reseptejä.</p>';
        return;
      }
      if (recipesList) recipesList.innerHTML = recipes.map(r => `
        <div class="recipe-card">
          <h3>${escapeHtml(r.title || r.name || '')}</h3>
          <p>${escapeHtml(r.description || '')}</p>
          <div class="recipe-actions">
            <button class="btn-edit" data-id="${r.id}">Muokkaa</button>
            <button class="btn-delete" data-id="${r.id}">Poista</button>
          </div>
        </div>
      `).join('');
    } catch (err) {
      if (recipesList) recipesList.innerHTML = `<p style="color:#d87093">${err.message}</p>`;
    }
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" })[m]); }

  loadRecipes();
});
