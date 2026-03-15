// Check if user is logged in
document.addEventListener('DOMContentLoaded', checkAuth);

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.href = '/login';
        } else {
            loadRecipes();
            populateEditSelect();
            setupEventListeners();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// Setup event listeners (CSP compliant - no inline handlers)
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function logout() {
    if (confirm('Haluatko varmasti kirjautua ulos?')) {
        fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            window.location.href = '/login';
        });
    }
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// ============ LOAD & DISPLAY RECIPES ============

async function loadRecipes() {
    try {
        const response = await fetch('/api/recipes');
        const recipes = await response.json();
        
        const recipesList = document.getElementById('recipesList');
        recipesList.innerHTML = '';
        
        if (!recipes || recipes.length === 0) {
            recipesList.innerHTML = '<p>Ei reseptejä vielä</p>';
            return;
        }
        
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <h3>${recipe.title}</h3>
                <p>${recipe.description}</p>
                <div class="recipe-actions">
                    <button class="btn-edit" onclick="loadForEdit(${recipe.id})">Muokkaa</button>
                    <button class="btn-delete" onclick="deleteRecipe(${recipe.id})">Poista</button>
                </div>
            `;
            recipesList.appendChild(card);
        });
    } catch (error) {
        document.getElementById('recipesError').textContent = 'Virhe reseptien lataamisessa: ' + error.message;
        document.getElementById('recipesError').style.display = 'block';
    }
}

async function populateEditSelect() {
    try {
        const response = await fetch('/api/recipes');
        const recipes = await response.json();
        
        const select = document.getElementById('editRecipeSelect');
        select.innerHTML = ''; // Clear existing options first
        
        recipes.forEach(recipe => {
            const option = document.createElement('option');
            option.value = recipe.id;
            option.textContent = recipe.title;
            select.appendChild(option);
        });
        
        // Remove previous listener to prevent duplicates
        select.removeEventListener('change', handleEditRecipeChange);
        select.addEventListener('change', handleEditRecipeChange);
    } catch (error) {
        console.error('Error loading recipes for edit:', error);
    }
}

function handleEditRecipeChange(e) {
    if (e.target.value) {
        loadForEdit(parseInt(e.target.value));
    }
}

// ============ ADD RECIPE ============

document.getElementById('addRecipeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('addTitle').value;
    const description = document.getElementById('addDescription').value;
    const image = document.getElementById('addImage').value;
    const categories = document.getElementById('addCategories').value
        .split(',')
        .map(c => c.trim())
        .filter(c => c);
    const ingredientAmounts = document.getElementById('addIngredients').value
        .split('\n')
        .map(i => i.trim())
        .filter(i => i);
    const instructions = document.getElementById('addInstructions').value
        .split('\n')
        .map(i => i.trim())
        .filter(i => i);
    
    try {
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title,
                description,
                image,
                categories,
                ingredientAmounts,
                instructions
            })
        });
        
        if (response.ok) {
            showMessage('addSuccess', 'Resepti lisätty onnistuneesti!');
            document.getElementById('addRecipeForm').reset();
            loadRecipes();
            populateEditSelect();
        } else {
            const data = await response.json();
            showMessage('addError', data.error || 'Virhe reseptin lisäämisessä');
        }
    } catch (error) {
        showMessage('addError', 'Yhteysvirhe: ' + error.message);
    }
});

// ============ DELETE RECIPE ============

async function deleteRecipe(id) {
    if (!confirm('Haluatko varmasti poistaa tämän reseptin?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/recipes/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            loadRecipes();
            populateEditSelect();
        } else {
            const data = await response.json();
            alert('Virhe: ' + (data.error || 'Poistaminen epäonnistui'));
        }
    } catch (error) {
        alert('Yhteysvirhe: ' + error.message);
    }
}

// ============ EDIT RECIPE ============

let currentEditId = null;

async function loadForEdit(id) {
    try {
        const response = await fetch(`/api/recipes/${id}`);
        const recipe = await response.json();
        
        currentEditId = recipe.id;
        document.getElementById('editTitle').value = recipe.title;
        document.getElementById('editDescription').value = recipe.description || '';
        document.getElementById('editImage').value = recipe.image || '';
        document.getElementById('editCategories').value = (recipe.categories || []).join(', ');
        document.getElementById('editIngredients').value = (recipe.ingredientAmounts || []).join('\n');
        document.getElementById('editInstructions').value = (recipe.instructions || []).join('\n');
        
        // Show the edit form
        document.getElementById('editRecipeForm').style.display = 'block';
        
        // Switch to edit tab
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('edit').classList.add('active');
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
    } catch (error) {
        showMessage('editError', 'Virhe reseptin lataamisessa: ' + error.message);
    }
}

document.getElementById('editRecipeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentEditId) {
        showMessage('editError', 'Ei valittua reseptiä');
        return;
    }
    
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const image = document.getElementById('editImage').value;
    const categories = document.getElementById('editCategories').value
        .split(',')
        .map(c => c.trim())
        .filter(c => c);
    const ingredientAmounts = document.getElementById('editIngredients').value
        .split('\n')
        .map(i => i.trim())
        .filter(i => i);
    const instructions = document.getElementById('editInstructions').value
        .split('\n')
        .map(i => i.trim())
        .filter(i => i);
    
    try {
        const response = await fetch(`/api/recipes/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title,
                description,
                image,
                categories,
                ingredientAmounts,
                instructions
            })
        });
        
        if (response.ok) {
            showMessage('editSuccess', 'Resepti päivitetty onnistuneesti!');
            loadRecipes();
            populateEditSelect();
            document.getElementById('editRecipeForm').style.display = 'none';
            document.getElementById('editRecipeSelect').value = '';
        } else {
            const data = await response.json();
            showMessage('editError', data.error || 'Virhe päivityksessä');
        }
    } catch (error) {
        showMessage('editError', 'Yhteysvirhe: ' + error.message);
    }
});

// ============ HELPER FUNCTIONS ============

function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    
    if (elementId.includes('Success')) {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
