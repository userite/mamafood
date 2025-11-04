// МАМАФООД - Основен файл с функционалности
document.addEventListener('DOMContentLoaded', function() {
    // Инициализиране на приложението
    initApp();
});

// Глобални променливи
let records = [];
const STORAGE_KEY = 'mamafood_records';
let situations = [];
let childCode = localStorage.getItem('mamafood_child_code') || generateChildCode();

// Инициализиране на приложението
function initApp() {
    // Запазване на кода на детето, ако не е запазен
    if (!localStorage.getItem('mamafood_child_code')) {
        localStorage.setItem('mamafood_child_code', childCode);
    }
    
    // Зареждане на ситуациите
    loadSituations();
    
    // Попълване на dropdown менюто за ситуации (от i18n.js)
    if (typeof updateSelectOptions === 'function') {
        updateSelectOptions();
    } else if (typeof updateUI === 'function') {
        // Ако updateSelectOptions не е достъпна, опитай updateUI
        updateUI();
    }
    
    // Зареждане на записите (асинхронно)
    loadRecords(); // Може да бъде async, но няма нужда да чакаме
    
    // Добавяне на слушатели за събития
    setupEventListeners();
    
    // Актуализиране на статистиката
    updateStats();
}

// Зареждане на ситуациите
function loadSituations() {
    // Ситуации за кърма
    situations = [
        { id: 'room', group: 'milk', name: 'Току-що изцедена', temp: 'до 25°C', duration: 4, unit: 'hour', validityHours: 4 },
        { id: 'fridge', group: 'milk', name: 'В хладилник', temp: '0-4°C', duration: 4, unit: 'day', validityHours: 96 },
        { id: 'freezer', group: 'milk', name: 'Фризер', temp: '-18°C', duration: 6, unit: 'month', validityHours: 4320 },
        { id: 'cooled', group: 'milk', name: 'Охладена (от фризер)', temp: '0-4°C', duration: 2, unit: 'hour', validityHours: 2 },
        { id: 'thawed', group: 'milk', name: 'Размразена', temp: 'хладилник', duration: 24, unit: 'hour', validityHours: 24 },
        { id: 'cooler-bag', group: 'milk', name: 'Хладилна чанта', temp: '0-4°C', duration: 24, unit: 'hour', validityHours: 24 },
        { id: 'heated', group: 'milk', name: 'Загрята', temp: 'стайна', duration: 1, unit: 'hour', validityHours: 1 },
        { id: 'taken-out', group: 'milk', name: 'Извадена неподгрята', temp: 'стайна', duration: 2, unit: 'hour', validityHours: 2 },
        // Ситуации за формула
        { id: 'formula-fresh', group: 'formula', name: 'Току-що приготвена', temp: 'стайна', duration: 2, unit: 'hour', validityHours: 2 },
        { id: 'formula-fridge', group: 'formula', name: 'В хладилник', temp: '0-4°C', duration: 24, unit: 'hour', validityHours: 24 },
        { id: 'formula-drunk', group: 'formula', name: 'Бебето е пило', temp: 'стайна', duration: 1, unit: 'hour', validityHours: 1 },
        { id: 'formula-warmed-once', group: 'formula', name: 'Затоплена веднъж', temp: '—', duration: 0, unit: 'hour', validityHours: 0.5 },
        { id: 'formula-powder-opened', group: 'formula', name: 'Отворена кутия (прах)', temp: 'стайна, сухо', duration: 30, unit: 'day', validityHours: 720 },
        { id: 'formula-powder-sealed', group: 'formula', name: 'Неотворена кутия (прах)', temp: 'стайна', duration: 365, unit: 'day', validityHours: 8760 }
    ];
    
    // Забележка: Dropdown менюто се попълва от updateSelectOptions() в i18n.js
    // което включва иконите. Няма нужда да го попълваме тук.
}

// Зареждане на записите (от API или localStorage)
async function loadRecords() {
    try {
        // Опит за зареждане от API
        const response = await fetch(`${API_BASE}/api/records/${childCode}`);
        if (response.ok) {
            const apiRecords = await response.json();
            records = apiRecords;
            
            // Запазване локално като fallback
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            
            renderRecords();
            return;
        }
    } catch (error) {
        console.warn('Could not load records from API, using local storage:', error);
    }
    
    // Fallback: зареждане от localStorage
    const storedRecords = localStorage.getItem(STORAGE_KEY);
    if (storedRecords) {
        records = JSON.parse(storedRecords);
    }
    
    renderRecords();
}

// Запазване на записите
function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    // Актуализиране на интерфейса
    renderRecords();
    updateStats();
    
    // Известяване на други компоненти за промяната
    document.dispatchEvent(new CustomEvent('recordsUpdated'));
}

// Настройване на слушатели за събития
function setupEventListeners() {
    const btnAdd = document.getElementById('btnAdd');
    const modalClose = document.getElementById('modalClose');
    const btnCancel = document.getElementById('btnCancel');
    const recordForm = document.getElementById('recordForm');
    
    // Бутон за добавяне на нов запис
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            openModalForAdd();
        });
    }
    
    // Бутони за затваряне на модалния прозорец
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (btnCancel) {
        btnCancel.addEventListener('click', closeModal);
    }
    
    // Форма за запис
    if (recordForm) {
        recordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveRecord();
        });
    }
    
    // Бутон за опресняване на данните
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', refreshData);
    }
}

// Функция за получаване на локално време в правилен формат за datetime-local input
function getLocalDateTimeString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Отваряне на модалния прозорец за добавяне
function openModalForAdd() {
    const modal = document.getElementById('recordModal');
    const modalTitle = document.getElementById('modalTitle');
    const recordForm = document.getElementById('recordForm');
    const datetimeInput = document.getElementById('datetime');
    
    // Изчистване на формата
    recordForm.reset();
    
    // Задаване на текущата дата и час (ЛОКАЛНО време)
    datetimeInput.value = getLocalDateTimeString();
    
    // Задаване на заглавие
    modalTitle.textContent = 'Добавяне на нова порция';
    
    // Изчистване на скрития input за ID
    document.getElementById('recordId').value = '';
    
    // Показване на модалния прозорец
    modal.style.display = 'flex';
}

// Отваряне на модалния прозорец за редактиране
function openModalForEdit(recordId) {
    const modal = document.getElementById('recordModal');
    const modalTitle = document.getElementById('modalTitle');
    
    // Конвертиране на recordId към правилния тип (string или number)
    const record = records.find(r => String(r.id) === String(recordId) || r.id === recordId);
    
    if (!record) {
        console.error('Record not found:', recordId, 'Available records:', records.map(r => r.id));
        return;
    }
    
    // Попълване на формата с данните от записа
    document.getElementById('amount').value = record.amount;
    document.getElementById('situation').value = record.situation;
    
    // Конвертиране на datetime към локално време
    const recordDate = new Date(record.datetime);
    document.getElementById('datetime').value = getLocalDateTimeString(recordDate);
    
    document.getElementById('notes').value = record.notes || '';
    document.getElementById('recordId').value = record.id;
    
    // Задаване на заглавие
    modalTitle.textContent = 'Редактиране на порция';
    
    // Показване на модалния прозорец
    modal.style.display = 'flex';
}

// Затваряне на модалния прозорец
function closeModal() {
    const modal = document.getElementById('recordModal');
    modal.style.display = 'none';
}

// API Configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : window.location.origin;

// Функция за получаване на следващия номер на порцията от сървъра
async function getNextRecordNumber(childCode) {
    try {
        const response = await fetch(`${API_BASE}/api/records/${childCode}/next-number`);
        if (response.ok) {
            const data = await response.json();
            return data.record_number;
        }
    } catch (error) {
        console.warn('Could not get next record number from server, using local calculation:', error);
    }
    
    // Fallback: изчисляване локално
    const maxNumber = records.reduce((max, r) => {
        const num = r.record_number || r.recordNumber || 0;
        return Math.max(max, num);
    }, 0);
    return maxNumber + 1;
}

// Запазване на запис
async function saveRecord() {
    const recordId = document.getElementById('recordId').value;
    const amount = document.getElementById('amount').value;
    const situation = document.getElementById('situation').value;
    let datetime = document.getElementById('datetime').value;
    const notes = document.getElementById('notes').value;
    
    // Конвертиране на локално време към ISO формат
    if (datetime && !datetime.includes('Z') && !datetime.includes('+')) {
        const localDate = new Date(datetime);
        datetime = localDate.toISOString();
    }
    
    // Създаване на нов запис
    const newRecord = {
        id: recordId || generateId(),
        amount: parseInt(amount),
        situation: situation,
        datetime: datetime,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    // Добавяне или актуализиране на записа
    if (recordId) {
        // Редактиране - запазваме стария номер
        const existingRecord = records.find(r => String(r.id) === String(recordId));
        if (existingRecord) {
            newRecord.record_number = existingRecord.record_number || existingRecord.recordNumber;
        }
        
        const index = records.findIndex(r => r.id === recordId);
        if (index !== -1) {
            records[index] = newRecord;
        }
        
        // Опит за синхронизация със сървъра (ако има)
        try {
            const response = await fetch(`${API_BASE}/api/records/${recordId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: newRecord.amount,
                    situation: newRecord.situation,
                    datetime: newRecord.datetime,
                    notes: newRecord.notes
                })
            });
            if (!response.ok) {
                console.warn('Failed to update record on server');
            }
        } catch (error) {
            console.warn('Could not sync update to server:', error);
        }
    } else {
        // Нов запис - получаваме номер от сървъра или изчисляваме локално
        newRecord.record_number = await getNextRecordNumber(childCode);
        
        // Опит за синхронизация със сървъра
        try {
            const response = await fetch(`${API_BASE}/api/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    child_code: childCode,
                    record_number: newRecord.record_number,
                    amount: newRecord.amount,
                    situation: newRecord.situation,
                    datetime: newRecord.datetime,
                    notes: newRecord.notes
                })
            });
            
            if (response.ok) {
                const serverRecord = await response.json();
                newRecord.id = serverRecord.id;
                newRecord.server_id = serverRecord.id;
            }
        } catch (error) {
            console.warn('Could not sync new record to server:', error);
        }
        
        records.push(newRecord);
    }
    
    // Запазване на записите
    saveRecords();
    
    // Затваряне на модалния прозорец
    closeModal();
}

// Изтриване на запис
async function deleteRecord(recordId) {
    // Конвертиране на recordId към правилния тип (string или number)
    if (confirm('Сигурни ли сте, че искате да изтриете този запис?')) {
        // Опит за изтриване от сървъра
        try {
            const response = await fetch(`${API_BASE}/api/records/${recordId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                console.warn('Failed to delete record on server');
            }
        } catch (error) {
            console.warn('Could not sync delete to server:', error);
        }
        
        records = records.filter(record => String(record.id) !== String(recordId) && record.id !== recordId);
        saveRecords();
    }
}

// Визуализиране на записите
function renderRecords() {
    const recordsList = document.getElementById('recordsList');
    const emptyState = document.getElementById('emptyState');
    
    if (recordsList) {
        // Изчистване на списъка
        recordsList.innerHTML = '';
        
        // Показване или скриване на съобщението за празен списък
        if (records.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }
        
        // Сортиране на записите по дата (най-новите първи)
        const sortedRecords = [...records].sort((a, b) => {
            return new Date(b.datetime) - new Date(a.datetime);
        });
        
        // Добавяне на записите към списъка
        sortedRecords.forEach(record => {
            const card = createRecordCard(record);
            recordsList.appendChild(card);
        });
        
        // Добавяне на event listeners за Edit и Delete бутони
        recordsList.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const recordId = btn.getAttribute('data-record-id');
                console.log('✏️ Edit clicked (event listener) for record:', recordId);
                openModalForEdit(recordId);
            });
        });
        
        recordsList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const recordId = btn.getAttribute('data-record-id');
                if (confirm('Сигурни ли сте, че искате да изтриете този запис?')) {
                    deleteRecord(recordId);
                }
            });
        });
    }
}

// Мапване на икони за всяка ситуация
const situationIcons = {
    'room': '🏠',
    'fridge': '🧊',
    'freezer': '❄️',
    'cooled': '🧊',
    'thawed': '💧',
    'cooler-bag': '🎒',
    'heated': '🔥',
    'taken-out': '🟡',
    'after-drinking': '🔴',
    'cooler-bag-breast': '🎒',
    'formula-prepared': '🟢',
    'formula-fridge': '🔵',
    'formula-baby-drank': '🔴',
    'formula-warmed-once': '🟡',
    'formula-powder-opened': '🟡',
    'formula-powder-sealed': '🟣'
};

// Функция за получаване на икона за ситуация
function getSituationIcon(situationId) {
    return situationIcons[situationId] || '📦';
}

// Функция за получаване на име на ситуация от translations
function getSituationName(situationId) {
    // Опитваме се да вземем от translations (от i18n.js)
    if (typeof translations !== 'undefined') {
        const lang = typeof currentLanguage !== 'undefined' ? currentLanguage : (localStorage.getItem('mamafood_language') || 'bg');
        if (translations[lang] && translations[lang].conditions && translations[lang].conditions[situationId]) {
            return translations[lang].conditions[situationId].name;
        }
    }
    // Fallback към situations масива
    const situation = situations.find(s => s.id === situationId);
    return situation ? situation.name : 'Неизвестна';
}

// Създаване на карта за запис
function createRecordCard(record) {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.setAttribute('data-id', record.id);
    
    // Намиране на информация за ситуацията
    const situation = situations.find(s => s.id === record.situation) || {
        name: 'Неизвестна',
        temp: '',
        duration: 0,
        unit: 'hour',
        validityHours: 0
    };
    
    // Получаване на икона и име от translations
    const situationIcon = getSituationIcon(record.situation);
    const situationName = getSituationName(record.situation);
    
    // Определяне на вида (изцедена/приготвена) според ситуацията
    const isFormula = record.situation && record.situation.startsWith('formula');
    const portionType = isFormula ? 'Приготвена' : 'Изцедена';
    
    // Форматиране на дата и час
    const recordDate = new Date(record.datetime);
    const formattedDate = recordDate.toLocaleDateString();
    const formattedTime = recordDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Изчисляване на срок на годност
    const expiryDate = new Date(recordDate.getTime() + situation.validityHours * 60 * 60 * 1000);
    const now = new Date();
    
    // Определяне на статуса
    let status = '';
    let statusClass = '';
    
    if (now > expiryDate) {
        status = 'Изтекла';
        statusClass = 'status-expired';
    } else {
        // Изчисляване на оставащото време
        const remainingTime = expiryDate - now;
        const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
        
        if (remainingHours < 2) {
            status = 'Изтича скоро!';
            statusClass = 'status-warning';
        } else {
            status = 'Годна';
            statusClass = 'status-ok';
        }
    }
    
    // Форматиране на срока на годност
    const formattedExpiry = expiryDate.toLocaleDateString() + ' ' + 
                           expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Получаване на номера на порцията (ако има)
    const recordNumber = record.record_number || record.recordNumber || '';
    
    // Създаване на съдържанието на картата
    card.innerHTML = `
        <div class="record-header">
            <span class="record-icon">🍼</span>
            <span class="record-title">${record.amount} ml</span>
        </div>
        <div class="record-details">
            <div class="record-info">
                <span class="record-type">${portionType}</span>
                <span class="record-date">${formattedDate}</span>
                <span class="record-time">${formattedTime}</span>
            </div>
            <div class="record-situation">
                <span>${situationIcon} ${situationName}</span>
                <span class="record-temp"><span class="temp-label">Температура:</span> ${situation.temp || ''}</span>
            </div>
        </div>
        <div class="record-expiry">
            <span class="record-expiry-label">Срок на годност:</span>
            <span class="record-expiry-date">${formattedExpiry}</span>
            <span class="record-status ${statusClass}">${status}</span>
        </div>
        ${record.notes ? `<div class="record-notes">${record.notes}</div>` : ''}
        <div class="record-actions">
            ${recordNumber ? `<span class="record-number-display">#${recordNumber}</span>` : ''}
            <button class="btn-edit" data-record-id="${record.id}" title="Редактирай">✏️</button>
            <button class="btn-delete" data-record-id="${record.id}" title="Изтрий">🗑️</button>
        </div>
    `;
    
    return card;
}

// Актуализиране на статистиката
function updateStats() {
    const totalRecordsElement = document.getElementById('totalRecords');
    const activeRecordsElement = document.getElementById('activeRecords');
    const expiringRecordsElement = document.getElementById('expiringRecords');
    
    if (totalRecordsElement) {
        totalRecordsElement.textContent = records.length;
    }
    
    if (activeRecordsElement || expiringRecordsElement) {
        let activeCount = 0;
        let expiringCount = 0;
        
        records.forEach(record => {
            // Намиране на информация за ситуацията
            const situation = situations.find(s => s.id === record.situation);
            if (situation) {
                // Изчисляване на срок на годност
                const recordDate = new Date(record.datetime);
                const expiryDate = new Date(recordDate.getTime() + situation.validityHours * 60 * 60 * 1000);
                const now = new Date();
                
                if (now <= expiryDate) {
                    activeCount++;
                    
                    // Проверка дали изтича скоро (в рамките на 2 часа)
                    const remainingTime = expiryDate - now;
                    const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
                    
                    if (remainingHours < 2) {
                        expiringCount++;
                    }
                }
            }
        });
        
        if (activeRecordsElement) {
            activeRecordsElement.textContent = activeCount;
        }
        
        if (expiringRecordsElement) {
            expiringRecordsElement.textContent = expiringCount;
        }
    }
}

// Помощна функция за получаване на текст за мерна единица
function getUnitText(unit) {
    switch (unit) {
        case 'hour': return 'ч';
        case 'day': return 'д';
        case 'month': return 'м';
        default: return '';
    }
}

// Помощна функция за генериране на уникален ID
function generateId() {
    return 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Помощна функция за генериране на код на дете
function generateChildCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Функция за опресняване на данните
function refreshData() {
    // Показваме съобщение, че данните се опресняват
    showToast("Опресняване на данните...");
    
    // Презареждаме всички данни
    loadRecords();
    
    // Показваме съобщение за успешно опресняване
    setTimeout(() => {
        showToast("Данните са опреснени успешно!");
    }, 500);
}

// Функция за показване на toast съобщение
function showToast(message) {
    // Проверяваме дали вече има toast елемент
    let toast = document.getElementById('toast');
    if (!toast) {
        // Създаваме нов toast елемент
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '1000';
        document.body.appendChild(toast);
    }
    
    // Задаваме съобщението
    toast.textContent = message;
    
    // Показваме toast съобщението
    toast.style.display = 'block';
    
    // Скриваме toast съобщението след 3 секунди
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Експортиране на функции в глобалния обхват
// Използваме setTimeout за да се гарантира че функциите са дефинирани
setTimeout(() => {
    if (typeof openModalForAdd === 'function') {
        window.openModalForAdd = openModalForAdd;
    }
    if (typeof openModalForEdit === 'function') {
        window.openModalForEdit = openModalForEdit;
    }
    if (typeof deleteRecord === 'function') {
        window.deleteRecord = deleteRecord;
    }
    window.editRecord = function(recordId) {
        console.log('✏️ Edit clicked for record:', recordId, typeof recordId);
        if (typeof openModalForEdit === 'function') {
            openModalForEdit(recordId);
        } else {
            console.error('openModalForEdit is not defined!');
        }
    };
    if (typeof refreshData === 'function') {
        window.refreshData = refreshData;
    }
    if (typeof getLocalDateTimeString === 'function') {
        window.getLocalDateTimeString = getLocalDateTimeString;
    }
    console.log('✅ Global functions exported');
}, 100);