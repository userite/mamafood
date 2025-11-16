// Internationalization (i18n) for МАМАФООД
const translations = {
    'bg': {
        // App title
        appName: 'МАМАФООД',
        addNew: 'Добави нов запис',
        
        // Main sections
        currentPortions: 'Текущи порции',
        expiredPortions: 'Изтекли порции',
        statistics: 'Статистика',
        totalPortions: 'Общо порции',
        active: 'Активни',
        expiringSoon: 'Изтичат скоро',
        noRecords: 'Няма записи. Добавете първа порция.',
        
        // Record status
        statusExpired: 'Изтекла',
        statusWarning: 'Изтича скоро!',
        statusOK: 'Годна',
        
        // Form labels
        addPortion: 'Добавяне на нова порция',
        editPortion: 'Редактиране на порция',
        amountLabel: 'Количество (ml)',
        situationLabel: 'Ситуация',
        datetimeLabel: 'Дата и час на изцеждане',
        notesLabel: 'Бележки (по избор)',
        notesPlaceholder: 'Допълнителни бележки...',
        
        // Form buttons
        save: 'Запази',
        cancel: 'Отказ',
        confirmChangeCode: 'Сигурни ли сте? Това ще смени базата данни.',
        enterChildCode: 'Въведете код за съществуваща база, или празно за нова:',
        export: 'Експорт',
        import: 'Импорт',
        
        // Record info
        pumped: 'Изцедена',
        prepared: 'Приготвена',
        temperature: 'Температура',
        deadline: 'Срок',
        expiryLabel: 'Срок на годност',
        unknown: 'Неизвестна',
        
        // Actions
        edit: 'Редактирай',
        delete: 'Изтрий',
        
        // Storage conditions
        conditions: {
            'room': { name: 'Току-що изцедена', temp: 'до 25°C', duration: 'до 4 ч (2ч препоръчително)' },
            'fridge': { name: 'В хладилник', temp: '0-4°C', duration: 'до 4 дни (72ч)' },
            'freezer': { name: 'Фризер', temp: '-18°C', duration: 'до 6 месеца' },
            'cooled': { name: 'Охладена (от фризер)', temp: '0-4°C', duration: 'до 2 ч (неподгрята)' },
            'thawed': { name: 'Размразена', temp: 'хладилник', duration: 'до 24 ч' },
            'cooler-bag': { name: 'Хладилна чанта', temp: '0-4°C', duration: 'до 24 ч' },
            'heated': { name: 'Загрята', temp: 'стайна', duration: 'до 1 ч (не загрявай втори път!)' },
            'taken-out': { name: 'Извадена неподгрята', temp: 'стайна', duration: 'до 2 ч' },
            'after-drinking': { name: 'Остатък след пиене', temp: 'стайна', duration: 'до 1 ч (после изхвърли)' },
            'cooler-bag-breast': { name: 'Охладена в ператонка', temp: '0-4°C', duration: 'до 24 ч' },
            'formula-prepared': { name: 'Приготвена (непипната)', temp: 'до 25°C', duration: 'до 2 ч (дай веднага ако може)' },
            'formula-fridge': { name: 'В хладилник (непипната)', temp: '0-4°C', duration: 'до 24 ч (в затворено шише)' },
            'formula-baby-drank': { name: 'Бебе пило', temp: 'стайна', duration: '1 ч макс (после изхвърли, не в хлад.)' },
            'formula-warmed-once': { name: 'Затоплена веднъж', temp: '—', duration: 'веднага (не претопляй!)' },
            'formula-powder-opened': { name: 'Отворена кутия (суха)', temp: 'стайна, сухо', duration: 'до 30 дни (не в хлад.)' },
            'formula-powder-sealed': { name: 'Неотворена кутия (суха)', temp: 'стайна', duration: '1-2 години (до срока)' }
        },
        
        // Groups
        groupBreastMilk: '🍼 Кърма',
        groupFormula: '🥤 Изкуствено мляко',
        
        // Confirmations
        confirmDelete: 'Сигурни ли сте, че искате да изтриете този запис?',
        
        // Time units
        hour: 'ч',
        day: 'д',
        month: 'м'
    },
    
    'en': {
        // App title
        appName: 'MAMAFOOD',
        addNew: 'Add new record',
        
        // Main sections
        currentPortions: 'Current Portions',
        expiredPortions: 'Expired Portions',
        statistics: 'Statistics',
        totalPortions: 'Total Portions',
        active: 'Active',
        expiringSoon: 'Expiring Soon',
        noRecords: 'No records. Add first portion.',
        
        // Record status
        statusExpired: 'Expired',
        statusWarning: 'Expiring Soon!',
        statusOK: 'OK',
        
        // Form labels
        addPortion: 'Add New Portion',
        editPortion: 'Edit Portion',
        amountLabel: 'Amount (ml)',
        situationLabel: 'Situation',
        datetimeLabel: 'Date and Time',
        notesLabel: 'Notes (optional)',
        notesPlaceholder: 'Additional notes...',
        
        // Form buttons
        save: 'Save',
        cancel: 'Cancel',
        confirmChangeCode: 'Are you sure? This will change the database.',
        enterChildCode: 'Enter code for existing database, or leave empty for new:',
        export: 'Export',
        import: 'Import',
        
        // Record info
        pumped: 'Pumped',
        prepared: 'Prepared',
        temperature: 'Temperature',
        deadline: 'Deadline',
        expiryLabel: 'Expiry Date',
        unknown: 'Unknown',
        
        // Actions
        edit: 'Edit',
        delete: 'Delete',
        
        // Storage conditions
        conditions: {
            'room': { name: 'Just Pumped', temp: 'up to 25°C', duration: 'up to 4h (2h recommended)' },
            'fridge': { name: 'In Fridge', temp: '0-4°C', duration: 'up to 4 days (72h)' },
            'freezer': { name: 'Freezer', temp: '-18°C', duration: 'up to 6 months' },
            'cooled': { name: 'Cooled (from freezer)', temp: '0-4°C', duration: 'up to 2h (not heated)' },
            'thawed': { name: 'Thawed', temp: 'fridge', duration: 'up to 24h' },
            'cooler-bag': { name: 'Cooler Bag', temp: '0-4°C', duration: 'up to 24h' },
            'heated': { name: 'Heated', temp: 'room temp', duration: 'up to 1h (don\'t heat twice!)' },
            'taken-out': { name: 'Taken Out (not heated)', temp: 'room temp', duration: 'up to 2h' },
            'after-drinking': { name: 'Remainder After Drinking', temp: 'room temp', duration: 'up to 1h (then discard)' },
            'cooler-bag-breast': { name: 'Cooled in Cooler Bag', temp: '0-4°C', duration: 'up to 24h' },
            'formula-prepared': { name: 'Prepared (untouched)', temp: 'up to 25°C', duration: 'up to 2h (give immediately if possible)' },
            'formula-fridge': { name: 'In Fridge (untouched)', temp: '0-4°C', duration: 'up to 24h (in closed bottle)' },
            'formula-baby-drank': { name: 'Baby Drank', temp: 'room temp', duration: '1h max (then discard, not in fridge)' },
            'formula-warmed-once': { name: 'Warmed Once', temp: '—', duration: 'immediately (don\'t reheat!)' },
            'formula-powder-opened': { name: 'Opened Canister (powder)', temp: 'room temp, dry', duration: 'up to 30 days (not in fridge)' },
            'formula-powder-sealed': { name: 'Unopened Canister (powder)', temp: 'room temp', duration: '1-2 years (until expiry date)' }
        },
        
        // Groups
        groupBreastMilk: '🍼 Breast Milk',
        groupFormula: '🥤 Formula',
        
        // Confirmations
        confirmDelete: 'Are you sure you want to delete this record?',
        
        // Time units
        hour: 'h',
        day: 'd',
        month: 'm'
    }
};

// Current language
let currentLanguage = localStorage.getItem('mamafood_language') || 'bg';

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Change language - will be overridden by app.js
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('mamafood_language', lang);
    updateUI();
}

// Make changeLanguage globally available
window.changeLanguageBase = changeLanguage;

// Update all UI elements
function updateUI() {
    // Update dynamic elements
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Update placeholders
    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    // Update options
    updateSelectOptions();
    
    // Update datetime input lang attribute and format hint
    const datetimeInput = document.getElementById('datetime');
    const datetimeFormatHint = document.getElementById('datetimeFormatHint');
    if (datetimeInput) {
        const currentLang = typeof currentLanguage !== 'undefined' ? currentLanguage : (localStorage.getItem('mamafood_language') || 'bg');
        datetimeInput.setAttribute('lang', currentLang === 'en' ? 'en-US' : 'bg-BG');
        // Update format hint
        if (datetimeFormatHint) {
            datetimeFormatHint.textContent = currentLang === 'en' ? 'Format: mm/dd/yyyy' : 'Формат: дд.мм.гггг';
        }
        // Force re-render of the input value to update format
        if (datetimeInput.value) {
            const currentValue = datetimeInput.value;
            datetimeInput.value = '';
            setTimeout(() => {
                datetimeInput.value = currentValue;
            }, 10);
        }
    }
    
    // Re-render records if function exists
    if (typeof renderRecords === 'function') {
        renderRecords();
    }
    
    // Update modal title if add/edit
    if (typeof openModalForAdd === 'function' && typeof openModalForEdit === 'function') {
        // Just re-render, modal will update when opened
    }
}

// Update select options
function updateSelectOptions() {
    const situationSelect = document.getElementById('situation');
    if (!situationSelect) return;
    
    const conds = t('conditions');
    
    situationSelect.innerHTML = `
        <option value="">${t('situationLabel')}</option>
        <optgroup label="${t('groupBreastMilk')}">
            <option value="room">🏠 ${conds.room.name} | ${conds.room.temp} | ${conds.room.duration}</option>
            <option value="fridge">🧊 ${conds.fridge.name} | ${conds.fridge.temp} | ${conds.fridge.duration}</option>
            <option value="freezer">❄️ ${conds.freezer.name} | ${conds.freezer.temp} | ${conds.freezer.duration}</option>
            <option value="cooled">🧊 ${conds.cooled.name} | ${conds.cooled.temp} | ${conds.cooled.duration}</option>
            <option value="thawed">💧 ${conds.thawed.name} | ${conds.thawed.temp} | ${conds.thawed.duration}</option>
            <option value="cooler-bag">🎒 ${conds['cooler-bag'].name} | ${conds['cooler-bag'].temp} | ${conds['cooler-bag'].duration}</option>
            <option value="heated">🔥 ${conds.heated.name} | ${conds.heated.temp} | ${conds.heated.duration}</option>
            <option value="taken-out">🟡 ${conds['taken-out'].name} | ${conds['taken-out'].temp} | ${conds['taken-out'].duration}</option>
            <option value="after-drinking">🔴 ${conds['after-drinking'].name} | ${conds['after-drinking'].temp} | ${conds['after-drinking'].duration}</option>
            <option value="cooler-bag-breast">🎒 ${conds['cooler-bag-breast'].name} | ${conds['cooler-bag-breast'].temp} | ${conds['cooler-bag-breast'].duration}</option>
        </optgroup>
        <optgroup label="${t('groupFormula')}">
            <option value="formula-prepared">🟢 ${conds['formula-prepared'].name} | ${conds['formula-prepared'].temp} | ${conds['formula-prepared'].duration}</option>
            <option value="formula-fridge">🔵 ${conds['formula-fridge'].name} | ${conds['formula-fridge'].temp} | ${conds['formula-fridge'].duration}</option>
            <option value="formula-baby-drank">🔴 ${conds['formula-baby-drank'].name} | ${conds['formula-baby-drank'].temp} | ${conds['formula-baby-drank'].duration}</option>
            <option value="formula-warmed-once">🟡 ${conds['formula-warmed-once'].name} | ${conds['formula-warmed-once'].temp} | ${conds['formula-warmed-once'].duration}</option>
            <option value="formula-powder-opened">🟡 ${conds['formula-powder-opened'].name} | ${conds['formula-powder-opened'].temp} | ${conds['formula-powder-opened'].duration}</option>
            <option value="formula-powder-sealed">🟣 ${conds['formula-powder-sealed'].name} | ${conds['formula-powder-sealed'].temp} | ${conds['formula-powder-sealed'].duration}</option>
        </optgroup>
    `;
}

// Автоматично попълване при зареждане
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(updateSelectOptions, 50);
        });
    } else {
        setTimeout(updateSelectOptions, 50);
    }
})();
