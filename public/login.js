// public/login.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('errorMsg');
  const successEl = document.getElementById('successMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (successEl) {
          successEl.textContent = 'Kirjautuminen onnistui, ohjataan…';
          successEl.style.display = 'block';
        }
        // Redirect to admin panel
        setTimeout(() => window.location.href = '/admin.html', 600);
      } else {
        if (errorEl) {
          errorEl.textContent = data.error || 'Kirjautuminen epäonnistui';
          errorEl.style.display = 'block';
        }
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Verkkovirhe';
        errorEl.style.display = 'block';
      }
    }
  });
});
