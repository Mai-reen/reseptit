// Reseptidata kategorioineen, ohjeineen ja määrineen
// Loaded from API at startup
let recipes = [];

// DOM-elementit
const recipeContainer = document.getElementById('recipe-container');
const groceryList = document.getElementById('grocery-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearListBtn = document.getElementById('clear-list-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Nykyinen suodatin
let currentFilter = 'kaikki';
let currentSearch = '';

// Load recipes from API
async function loadRecipes() {
    try {
        const response = await fetch('/api/recipes');
        if (response.ok) {
            recipes = await response.json();
        } else {
            console.warn('Failed to load recipes from API');
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
    displayRecipes(recipes);
}

// Alusta sovellus
function init() {
    loadRecipes();
    loadGroceryList();
    
    // Tapahtumakuuntelijat
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    clearListBtn.addEventListener('click', clearGroceryList);
    
    // Suodatinpainikkeet
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Poista aktiivinen luokka kaikilta
            filterBtns.forEach(b => b.classList.remove('active'));
            // Lisää aktiivinen luokka klikatulle
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-category');
            applyFilters();
        });
    });

    // ESC-näppäin sulkee modalin
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('recipe-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    });
}

// Näytä reseptit ruudukossa
function displayRecipes(recipesToShow) {
    recipeContainer.innerHTML = '';
    
    if (recipesToShow.length === 0) {
        recipeContainer.innerHTML = '<p class="empty-list">Reseptejä ei löytynyt. Kokeile toista hakusanaa tai suodatinta.</p>';
        return;
    }
    
    recipesToShow.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card';
        
        recipeCard.innerHTML = `
            <div class="recipe-image" style="background-image: url('${recipe.image}')"></div>
            <div class="recipe-category">${recipe.categories.map(cat => getCategoryName(cat)).join(', ')}</div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <button class="add-to-list-btn" data-id="${recipe.id}">Lisää ostoslistaan</button>
                <button class="show-instructions-btn" data-id="${recipe.id}">Näytä ohje</button>
            </div>
        `;
        
        recipeContainer.appendChild(recipeCard);
    });
    
    // Lisää tapahtumakuuntelijat "Lisää ostoslistaan" -painikkeisiin
    document.querySelectorAll('.add-to-list-btn').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = parseInt(this.getAttribute('data-id'));
            addRecipeToGroceryList(recipeId);
        });
    });
    
    // Lisää tapahtumakuuntelijat ohjenappeihin
    document.querySelectorAll('.show-instructions-btn').forEach(button => {
        button.addEventListener('click', function() {
            const recipeId = parseInt(this.getAttribute('data-id'));
            showRecipeInstructions(recipeId);
        });
    });
}

// Kategorian nimi suomeksi
function getCategoryName(category) {
    const categories = {
        'pääruoka': 'Pääruoka',
        'jälkiruoka': 'Jälkiruoka',
        'kasvisruoka': 'Kasvisruoka',
        'alkupala': 'Alkupala',
        'leivonnainen': 'Leivonnainen',
        'aasialainen': 'Aasialainen'
    };
    return categories[category] || category;
}

// Käsittele hakutoiminto
function handleSearch() {
    currentSearch = searchInput.value.toLowerCase().trim();
    applyFilters();
}

// Käytä suodattimia
function applyFilters() {
    let filteredRecipes = recipes;
    
    // Tekstihaku
    if (currentSearch) {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.title.toLowerCase().includes(currentSearch) ||
            recipe.description.toLowerCase().includes(currentSearch) ||
            (Array.isArray(recipe.ingredientAmounts) && recipe.ingredientAmounts.some(ingredient => 
                ingredient.toLowerCase().includes(currentSearch)
            ))
        );
    }
    
    // Kategoriasuodatin
    if (currentFilter !== 'kaikki') {
        filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.categories.includes(currentFilter)
        );
    }
    
    displayRecipes(filteredRecipes);
}

// Näytä reseptin ohjeet
function showRecipeInstructions(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const modal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-recipe-content');
    
    // Luo ohjesisältö
    modalContent.innerHTML = `
        <h2>${recipe.title}</h2>
        <div class="modal-recipe-image" style="background-image: url('${recipe.image}')"></div>
        
        <div class="ingredients-with-amounts">
            <h4>Ainekset:</h4>
            <ul class="amount-list">
                ${recipe.ingredientAmounts.map(amount => `<li>${amount}</li>`).join('')}
            </ul>
        </div>
        
        <div class="recipe-instructions">
            <h3>Valmistusohje:</h3>
            <ol class="instruction-steps">
                ${recipe.instructions.map(instruction => `
                    <li class="instruction-step">${instruction}</li>
                `).join('')}
            </ol>
        </div>
    `;
    
    // Näytä modal
    modal.style.display = 'block';
    
    // Sulje modal klikkaamalla x-painiketta
    document.querySelector('.close-modal').onclick = function() {
        modal.style.display = 'none';
    }
    
    // Sulje modal klikkaamalla taustaa
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Lisää reseptin ainekset ostoslistaan
function addRecipeToGroceryList(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Hae nykyinen ostoslista localStorage):sta
    let currentList = JSON.parse(localStorage.getItem('groceryList')) || [];
    
    // Lisää uudet ainekset määrineen (yhdistä samat ainekset)
    recipe.ingredientAmounts.forEach(ingredientWithAmount => {
        // Etsi onko aines jo listalla
        const existingIndex = currentList.findIndex(item => {
            const itemName = item.split(' - ')[0];
            const newItemName = ingredientWithAmount.split(' - ')[0];
            return itemName === newItemName;
        });
        
        if (existingIndex === -1) {
            // Jos ei ole, lisää uutena
            currentList.push(ingredientWithAmount);
        } else {
            // Jos on, yhdistä määrät
            const existing = currentList[existingIndex];
            currentList[existingIndex] = `${existing} + ${ingredientWithAmount}`;
        }
    });
    
    // Tallenna päivitetty lista
    localStorage.setItem('groceryList', JSON.stringify(currentList));
    
    // Päivitä näkymä
    displayGroceryList();
}

// Näytä ostoslista
function displayGroceryList() {
    groceryList.innerHTML = '';
    const currentList = JSON.parse(localStorage.getItem('groceryList')) || [];
    
    if (currentList.length === 0) {
        groceryList.innerHTML = '<p class="empty-list">Ostoslista on tyhjä. Lisää aineksia resepteistä!</p>';
        return;
    }
    
    currentList.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'grocery-item';
        li.innerHTML = `
            <input type="checkbox" id="item-${index}">
            <label for="item-${index}">${item}</label>
            <button class="delete-item-btn" data-index="${index}">✕</button>
        `;
        groceryList.appendChild(li);
    });
    
    // Lisää tapahtumakuuntelijat poista-painikkeille
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeFromGroceryList(index);
        });
    });
}

// Poista tavara ostoslistalta
function removeFromGroceryList(index) {
    let currentList = JSON.parse(localStorage.getItem('groceryList')) || [];
    currentList.splice(index, 1);
    localStorage.setItem('groceryList', JSON.stringify(currentList));
    displayGroceryList();
}

// Tyhjennä ostoslista
function clearGroceryList() {
    if (confirm('Haluatko varmasti tyhjentää ostoslistan?')) {
        localStorage.removeItem('groceryList');
        displayGroceryList();
    }
}

// Lataa ostoslista sivun latautuessa
function loadGroceryList() {
    displayGroceryList();
}

// Aloita sovellus kun DOM on valmis
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
