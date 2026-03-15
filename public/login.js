function showError(message) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMsg');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

function clearMessages() {
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('successMsg').style.display = 'none';
}

// Check if already logged in
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        if (response.ok) {
            window.location.href = '/admin';
        }
    } catch (error) {
        // Not logged in, continue
    }

    // Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const form = e.target;
        form.classList.add('loading');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Kirjautuminen onnistui! Uudelleenohjauksessa...');
                setTimeout(() => window.location.href = '/admin', 1500);
            } else {
                showError(data.error || 'Kirjautuminen epäonnistui');
            }
        } catch (error) {
            showError('Yhteysvirhe: ' + error.message);
        } finally {
            form.classList.remove('loading');
        }
    });
});
