// Дневник за развитието на бебето
let developmentMilestones = [];
const DEVELOPMENT_STORAGE_KEY = 'mamafood_development';

// Инициализиране на дневника за развитие
function initDevelopment() {
    loadDevelopmentData();
    renderDevelopmentUI();
}

// Зареждане на данните от localStorage
function loadDevelopmentData() {
    const savedData = localStorage.getItem(DEVELOPMENT_STORAGE_KEY);
    if (savedData) {
        developmentMilestones = JSON.parse(savedData);
    }
}

// Запазване на данните в localStorage
function saveDevelopmentData() {
    localStorage.setItem(DEVELOPMENT_STORAGE_KEY, JSON.stringify(developmentMilestones));
}

// Добавяне на ново постижение
function addMilestone(date, category, title, notes) {
    const id = Date.now().toString();
    const milestone = {
        id,
        date,
        category,
        title,
        notes,
        photos: []
    };
    
    developmentMilestones.push(milestone);
    saveDevelopmentData();
    renderDevelopmentUI();
}

// Изтриване на постижение
function deleteMilestone(id) {
    developmentMilestones = developmentMilestones.filter(m => m.id !== id);
    saveDevelopmentData();
    renderDevelopmentUI();
}

// Добавяне на снимка към постижение
function addPhotoToMilestone(id, photoUrl) {
    const milestone = developmentMilestones.find(m => m.id === id);
    if (milestone) {
        milestone.photos.push(photoUrl);
        saveDevelopmentData();
        renderDevelopmentUI();
    }
}

// Категории за развитие
const DEVELOPMENT_CATEGORIES = [
    { id: 'motor', name: 'Двигателно развитие', icon: '🏃' },
    { id: 'cognitive', name: 'Когнитивно развитие', icon: '🧠' },
    { id: 'social', name: 'Социално развитие', icon: '👪' },
    { id: 'language', name: 'Езиково развитие', icon: '🗣️' },
    { id: 'other', name: 'Други постижения', icon: '🌟' }
];

// Рендериране на UI за дневника за развитие
function renderDevelopmentUI() {
    const container = document.getElementById('development-tab');
    if (!container) return;
    
    // Изчистване на контейнера
    container.innerHTML = `
        <h2>Дневник за развитието на бебето</h2>
        
        <div class="development-form-container">
            <h3>Добави ново постижение</h3>
            <form id="development-form">
                <div class="form-group">
                    <label for="milestone-date">Дата:</label>
                    <input type="date" id="milestone-date" required>
                </div>
                <div class="form-group">
                    <label for="milestone-category">Категория:</label>
                    <select id="milestone-category" required>
                        ${DEVELOPMENT_CATEGORIES.map(category => 
                            `<option value="${category.id}">${category.icon} ${category.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="milestone-title">Заглавие:</label>
                    <input type="text" id="milestone-title" placeholder="Напр. Първи стъпки" required>
                </div>
                <div class="form-group">
                    <label for="milestone-notes">Бележки:</label>
                    <textarea id="milestone-notes" placeholder="Опишете постижението..."></textarea>
                </div>
                <button type="submit" class="btn-primary">Добави постижение</button>
            </form>
        </div>
        
        <div class="milestones-timeline">
            <h3>Хронология на развитието</h3>
            ${renderMilestonesTimeline()}
        </div>
    `;
    
    // Добавяне на слушатели за събития
    const form = document.getElementById('development-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const date = document.getElementById('milestone-date').value;
            const category = document.getElementById('milestone-category').value;
            const title = document.getElementById('milestone-title').value;
            const notes = document.getElementById('milestone-notes').value;
            
            if (!date || !category || !title) return;
            
            addMilestone(date, category, title, notes);
            form.reset();
        });
    }
    
    // Добавяне на слушатели за бутоните за изтриване
    document.querySelectorAll('.delete-milestone').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            deleteMilestone(id);
        });
    });
}

// Рендериране на хронологията на постиженията
function renderMilestonesTimeline() {
    if (developmentMilestones.length === 0) {
        return '<p>Все още няма записани постижения</p>';
    }
    
    // Сортиране на постиженията по дата (от най-новите към най-старите)
    const sortedMilestones = [...developmentMilestones].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    return `
        <div class="timeline">
            ${sortedMilestones.map(milestone => {
                const category = DEVELOPMENT_CATEGORIES.find(c => c.id === milestone.category) || 
                                DEVELOPMENT_CATEGORIES[4]; // Default to "Other"
                
                return `
                    <div class="timeline-item">
                        <div class="timeline-date">
                            <span class="date">${formatDate(milestone.date)}</span>
                            <span class="category-icon">${category.icon}</span>
                        </div>
                        <div class="timeline-content">
                            <h4>${milestone.title}</h4>
                            <p>${milestone.notes}</p>
                            ${milestone.photos.length > 0 ? 
                                `<div class="milestone-photos">
                                    ${milestone.photos.map(photo => 
                                        `<img src="${photo}" alt="Снимка на постижение" class="milestone-photo">`
                                    ).join('')}
                                </div>` : ''
                            }
                            <div class="milestone-actions">
                                <button class="delete-milestone" data-id="${milestone.id}">Изтрий</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Форматиране на дата
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Инициализиране при зареждане на страницата
document.addEventListener('DOMContentLoaded', () => {
    initDevelopment();
    
    // Добавяне на слушател за таб бутона
    const developmentTab = document.getElementById('developmentTab');
    if (developmentTab) {
        developmentTab.addEventListener('click', () => {
            // Скриване на всички табове
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Показване на таба за развитие
            const developmentTabContent = document.getElementById('development-tab');
            if (developmentTabContent) {
                developmentTabContent.style.display = 'block';
            }
            
            // Активиране на бутона
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });
            developmentTab.classList.add('active');
        });
    }
});