// МАМАФООД - Основен файл с функционалности
document.addEventListener('DOMContentLoaded', function() {
    console.log('[App Init] DOMContentLoaded - проверка за UIK система');
    
    // Проверка за UIK система преди стартиране на приложението
    // Изчакваме малко за да се заредят всички скриптове
    setTimeout(function() {
        console.log('[App Init] Проверка за initUIKSystem функция...');
        console.log('[App Init] - typeof initUIKSystem:', typeof initUIKSystem);
        console.log('[App Init] - typeof window.initUIKSystem:', typeof window.initUIKSystem);
        
        if (typeof initUIKSystem === 'function') {
            console.log('[App Init] ✅ UIK системата е заредена, инициализираме я');
            // UIK системата е заредена, инициализираме я
            // Тя ще покаже registration или login screen според дали има запазен UIK
            // Основното приложение ще се стартира след успешен вход чрез startApp()
            initUIKSystem();
        } else if (typeof window.initUIKSystem === 'function') {
            console.log('[App Init] ✅ UIK системата е заредена (чрез window), инициализираме я');
            window.initUIKSystem();
        } else {
            console.log('[App Init] ⚠️ UIK системата не е заредена, стартираме нормално приложението');
            // UIK системата не е заредена, стартираме нормално приложението
            window.appInitialized = true;
            initApp();
        }
    }, 100);
});

// Глобални променливи
let records = [];
const STORAGE_KEY = 'mamafood_records';
let situations = [];
// Зареждане на код на детето от localStorage, винаги в главни букви
let childCode = (localStorage.getItem('mamafood_child_code') || generateChildCode()).toUpperCase();

// Актуализиране на tooltip-а на бутона за код на детето и header-а
function updateChildCodeTooltip() {
    const btn = document.getElementById('btnChildCode');
    if (btn) {
        const childName = localStorage.getItem('mamafood_child_name') || '';
        if (childName) {
            btn.title = `Код: ${childCode} | Име: ${childName}`;
        } else {
            btn.title = `Код: ${childCode}`;
        }
    }
    
    // Актуализиране на видимото показване в header-а
    updateChildInfoDisplay();
}

// Актуализиране на видимото показване на кода и името в header-а
function updateChildInfoDisplay() {
    const codeDisplay = document.getElementById('childCodeDisplayHeader');
    const nameDisplay = document.getElementById('childNameDisplayHeader');
    const childInfo = document.getElementById('childInfo');
    const childName = localStorage.getItem('mamafood_child_name') || '';
    
    if (codeDisplay) {
        codeDisplay.textContent = childCode ? `[${childCode}]` : '';
    }
    
    if (nameDisplay) {
        if (childName) {
            nameDisplay.textContent = childName;
        } else {
            nameDisplay.textContent = '';
        }
    }
    
    // Показване/скриване на целия child-info според дали има код
    if (childInfo) {
        if (childCode) {
            childInfo.style.display = 'inline-flex';
        } else {
            childInfo.style.display = 'none';
        }
    }
}

// Зареждане на информация за детето от backend-а
async function loadChildInfo() {
    try {
        // Уверяваме се, че кодът е в главни букви
        const upperChildCode = (childCode || '').toUpperCase();
        if (!upperChildCode) {
            console.log('[loadChildInfo] Няма избран child_code, пропускам зареждане');
            return;
        }
        
        console.log(`[loadChildInfo] Зареждане на информация за дете: ${upperChildCode}`);
        const response = await fetch(`${API_BASE}/api/children/${upperChildCode}`);
        
        if (response.ok) {
            const childInfo = await response.json();
            console.log(`[loadChildInfo] Получена информация:`, childInfo);
            if (childInfo.name) {
                localStorage.setItem('mamafood_child_name', childInfo.name);
                updateChildCodeTooltip();
            } else {
                // Актуализираме display-а дори и да няма име
                updateChildCodeTooltip();
            }
        } else {
            console.warn(`[loadChildInfo] Response status: ${response.status}, пропускам`);
            updateChildCodeTooltip();
        }
    } catch (error) {
        // Ако детето не съществува, това е нормално при първо използване
        console.log('[loadChildInfo] Грешка при зареждане (нормално при първо използване):', error.message);
        // Актуализираме display-а дори и при грешка
        updateChildCodeTooltip();
    }
}

// Инициализиране на приложението
function initApp() {
    // Запазване на кода на детето, ако не е запазен
    if (!localStorage.getItem('mamafood_child_code')) {
        localStorage.setItem('mamafood_child_code', childCode);
    }
    
    // СИНХРОНИЗИРАНЕ НА ЕЗИКА ПРЕДИ ВСИЧКО ДРУГО
    // Това гарантира, че currentLanguage в i18n.js е правилно синхронизиран с localStorage
    const storedLang = localStorage.getItem('mamafood_language') || 'bg';
    if (typeof currentLanguage !== 'undefined') {
        currentLanguage = storedLang;
    }
    // Извикваме getCurrentLanguage() за да се синхронизира и той
    getCurrentLanguage();
    
    // Актуализиране на tooltip-а и display-а
    updateChildCodeTooltip();
    
    // Зареждане на ситуациите
    loadSituations();
    
    // Попълване на dropdown менюто за ситуации (от i18n.js)
    // Извикваме updateUI() за да се актуализира всичко с правилния език
    if (typeof updateUI === 'function') {
        updateUI();
    } else if (typeof updateSelectOptions === 'function') {
        updateSelectOptions();
    }
    
    // Зареждане на записите (асинхронно)
    loadRecords(); // Може да бъде async, но няма нужда да чакаме
    
    // Изчистване на стари записи от списъка с известия
    cleanupNotifiedPortions();
    
    // Изтриване на изтекли порции, по-стари от 2 дена
    cleanupExpiredRecords();
    
    // Зареждане на информация за детето
    loadChildInfo();
    
    // Актуализиране на статуса на push notifications
    updatePushButtonStatus();
    
    // Добавяне на слушатели за събития
    setupEventListeners();
    
    // Статистиката ще се актуализира автоматично след като записите се заредят в loadRecords()
    
    // Стартиране на проверката за изтичащи порции
    startExpiryCheck();
    
    // Периодично изчистване на изтекли порции (всеки ден)
    setInterval(() => {
        cleanupExpiredRecords();
    }, 24 * 60 * 60 * 1000); // 24 часа
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
        { id: 'formula-prepared', group: 'formula', name: 'Приготвена (непипната)', temp: 'до 25°C', duration: 2, unit: 'hour', validityHours: 2 },
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
let isLoadingRecords = false;
let lastLoadTime = 0;
async function loadRecords() {
    // Защита срещу множествено извикване
    const now = Date.now();
    if (isLoadingRecords) {
        console.log('[loadRecords] Вече се зарежда, пропускам...');
        return;
    }
    
    // Ако е извикано преди по-малко от 500ms, пропускаме
    if (now - lastLoadTime < 500) {
        console.log('[loadRecords] Твърде скоро след последното зареждане, пропускам...');
        return;
    }
    
    isLoadingRecords = true;
    lastLoadTime = now;
    
    // Изчистване на старите данни преди зареждане на нови
    const upperChildCode = (childCode || '').toUpperCase();
    records = [];
    
    let response = null;
    let loadedFromAPI = false;
    try {
        // Опит за зареждане от API (уверяваме се, че кодът е в главни букви)
        console.log(`[loadRecords] Зареждане на записи за код: ${upperChildCode}`);
        console.log(`[loadRecords] API_BASE: ${API_BASE}`);
        console.log(`[loadRecords] Window location: ${window.location.href}`);
        console.log(`[loadRecords] Window origin: ${window.location.origin}`);
        console.log(`[loadRecords] Window hostname: ${window.location.hostname}`);
        
        const apiUrl = `${API_BASE}/api/records/${upperChildCode}`;
        // Добавяме cache-busting параметър за да избегнем кеширане на стари данни
        const cacheBuster = `?t=${Date.now()}`;
        const fullUrl = `${apiUrl}${cacheBuster}`;
        console.log(`[loadRecords] Full API URL: ${fullUrl}`);
        
        response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Accept': 'application/json'
            }
        });
        console.log(`[loadRecords] Response status: ${response.status}`);
        console.log(`[loadRecords] Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const apiRecords = await response.json();
            console.log(`[loadRecords] Заредени ${apiRecords.length} записа от API`);
            console.log(`[loadRecords] ========== ВСИЧКИ ЗАПИСИ ОТ API ==========`);
            apiRecords.forEach((r, idx) => {
                console.log(`[loadRecords] Запис ${idx + 1}:`, {
                    id: r.id,
                    child_code: r.child_code,
                    situation: r.situation,
                    datetime: r.datetime,
                    datetime_parsed: new Date(r.datetime).toISOString(),
                    amount: r.amount,
                    record_number: r.record_number,
                    notes: r.notes || null
                });
            });
            console.log(`[loadRecords] ==========================================`);
            
            // Проверка за дублиране в данните от API
            const apiIds = apiRecords.map(r => r.id);
            const uniqueApiIds = [...new Set(apiIds)];
            if (apiIds.length !== uniqueApiIds.length) {
                console.warn(`[loadRecords] ДУБЛИРАНЕ в данните от API! Общо: ${apiIds.length}, Уникални: ${uniqueApiIds.length}`);
                const duplicates = apiIds.filter((id, index) => apiIds.indexOf(id) !== index);
                console.warn(`[loadRecords] Дублирани ID-та:`, duplicates);
            }
            
            // Филтриране на записите по текущия child_code (за всеки случай)
            const upperChildCode = (childCode || '').toUpperCase();
            console.log(`[loadRecords] Филтриране на записи за код: "${upperChildCode}"`);
            console.log(`[loadRecords] Детайли за всички записи от API:`, apiRecords.map(r => ({
                id: r.id,
                child_code: r.child_code,
                child_code_type: typeof r.child_code,
                child_code_upper: (r.child_code || '').toUpperCase(),
                matches: ((r.child_code || '').toUpperCase() === upperChildCode),
                situation: r.situation,
                datetime: r.datetime,
                amount: r.amount,
                record_number: r.record_number
            })));
            
            records = apiRecords.filter(r => {
                const recordCode = (r.child_code || '').toUpperCase();
                const matches = recordCode === upperChildCode;
                if (!matches) {
                    console.log(`[loadRecords] Запис ${r.id} пропуснат: код "${recordCode}" !== "${upperChildCode}"`);
                } else {
                    console.log(`[loadRecords] ✅ Запис ${r.id} включен: код "${recordCode}" === "${upperChildCode}"`);
                }
                return matches;
            });
            console.log(`[loadRecords] Филтрирани ${records.length} записа за код ${upperChildCode} (от ${apiRecords.length} общо от API)`);
            
            // Проверка за несъответствие
            if (records.length !== apiRecords.length && apiRecords.length > 0) {
                const excludedIds = apiRecords.filter(r => {
                    const recordCode = (r.child_code || '').toUpperCase();
                    return recordCode !== upperChildCode;
                }).map(r => r.id);
                console.warn(`[loadRecords] ⚠️ Някои записи са изключени:`, excludedIds);
            }
            
            // Проверка за дублирани ID-та в филтрираните записи
            const recordIds = records.map(r => r.id);
            const uniqueRecordIds = [...new Set(recordIds)];
            if (recordIds.length !== uniqueRecordIds.length) {
                const duplicates = recordIds.filter((id, index) => recordIds.indexOf(id) !== index);
                console.error(`[loadRecords] ❌ ДУБЛИРАНИ ID-та в филтрираните записи:`, duplicates);
            }
            loadedFromAPI = true;
            
            // Запазване локално като fallback (запазваме всички записи, не само за текущия код)
            // За да не загубим данни за други кодове
            const allStoredRecords = localStorage.getItem(STORAGE_KEY);
            let allRecords = [];
            if (allStoredRecords) {
                try {
                    allRecords = JSON.parse(allStoredRecords);
                    // Премахваме старите записи за текущия код и добавяме новите
                    allRecords = allRecords.filter(r => {
                        const recordCode = (r.child_code || '').toUpperCase();
                        return recordCode !== upperChildCode;
                    });
                } catch (e) {
                    console.warn('[loadRecords] Грешка при парсване на старите записи:', e);
                    allRecords = [];
                }
            }
            // Добавяме новите записи за текущия код
            allRecords = [...allRecords, ...records];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
            
            // Синхронизиране на currentLanguage преди рендиране
            if (typeof currentLanguage !== 'undefined') {
                const storedLang = localStorage.getItem('mamafood_language') || 'bg';
                if (currentLanguage !== storedLang) {
                    currentLanguage = storedLang;
                }
            }
            
            console.log(`[loadRecords] Извикване на renderRecords() с ${records.length} записа`);
            renderRecords();
            updateStats();
            checkExpiringPortions();
            isLoadingRecords = false;
            return;
        } else {
            // ВРЕМЕННО: Не използваме localStorage, показваме грешката
            console.error(`[loadRecords] ❌ API върна статус ${response.status}`);
            try {
                const errorText = await response.text();
                console.error(`[loadRecords] Response body:`, errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error(`[loadRecords] Error details:`, errorJson);
                } catch (e) {
                    console.error(`[loadRecords] Error text (не е JSON):`, errorText);
                }
            } catch (e) {
                console.error(`[loadRecords] Не можах да прочета response body:`, e);
            }
            // Не зареждаме от localStorage - показваме грешката
            records = [];
            renderRecords();
            updateStats();
            isLoadingRecords = false;
            return;
        }
    } catch (error) {
        // ВРЕМЕННО: Не използваме localStorage, показваме грешката
        console.error('[loadRecords] ❌ Грешка при зареждане от API:', error);
        console.error('[loadRecords] Error message:', error.message);
        console.error('[loadRecords] Error stack:', error.stack);
        // Не зареждаме от localStorage - показваме грешката
        records = [];
        renderRecords();
        updateStats();
        isLoadingRecords = false;
        return;
    } finally {
        // ВРЕМЕННО ИЗКЛЮЧЕНО: localStorage fallback
        // if (!loadedFromAPI) {
        //     const storedRecords = localStorage.getItem(STORAGE_KEY);
        //     if (storedRecords) {
        //         try {
        //             const allRecords = JSON.parse(storedRecords);
        //             const upperChildCode = (childCode || '').toUpperCase();
        //             records = allRecords.filter(r => {
        //                 const recordCode = (r.child_code || '').toUpperCase();
        //                 return recordCode === upperChildCode;
        //             });
        //             console.log(`[loadRecords] Заредени ${records.length} записа от localStorage за код ${upperChildCode} (от общо ${allRecords.length})`);
        //         } catch (e) {
        //             console.warn('[loadRecords] Грешка при парсване на localStorage:', e);
        //             records = [];
        //         }
        //     } else {
        //         records = [];
        //     }
        //     
        //     renderRecords();
        //     updateStats();
        //     checkExpiringPortions();
        // }
        
        isLoadingRecords = false;
    }
}

// Запазване на записите
function saveRecords() {
    // Запазваме всички записи в localStorage (за всички кодове)
    // За да не загубим данни при смяна на код
    const allStoredRecords = localStorage.getItem(STORAGE_KEY);
    let allRecords = [];
    
    if (allStoredRecords) {
        try {
            allRecords = JSON.parse(allStoredRecords);
        } catch (e) {
            console.warn('[saveRecords] Грешка при парсване на старите записи:', e);
            allRecords = [];
        }
    }
    
    // Премахваме старите записи за текущия код
    const upperChildCode = (childCode || '').toUpperCase();
    allRecords = allRecords.filter(r => {
        const recordCode = (r.child_code || '').toUpperCase();
        return recordCode !== upperChildCode;
    });
    
    // Добавяме текущите записи (които са филтрирани по текущия код)
    allRecords = [...allRecords, ...records];
    
    // Запазваме всички записи
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
    
    // НЕ извикваме renderRecords() тук, защото това може да причини цикъл
    // renderRecords() трябва да се извиква само от loadRecords() или след промяна на данните
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
        // Деактивиране на формата по подразбиране, за да предотвратим множествено submit
        recordForm.setAttribute('data-submitting', 'false');
        
        recordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation(); // Спиране на всички други event listeners
            
            // КРИТИЧНО: Деактивиране на формата ВЕДНАГА, преди дори да проверя флага
            // Това предотвратява всички следващи submit-и
            const submitButton = recordForm.querySelector('button[type="submit"]');
            if (submitButton && submitButton.disabled) {
                console.warn('[Form] ⚠️ Бутонът вече е деактивиран, игнорирам submit...');
                return;
            }
            
            // КРИТИЧНО: Проверка на data атрибута ПРЕДИ всичко друго (по-бързо от променлива)
            if (recordForm.getAttribute('data-submitting') === 'true' || isSaving) {
                console.warn('[Form] ⚠️ Вече се запазва (data-submitting или isSaving), игнорирам submit...');
                return;
            }
            
            // Задаваме И двата флага ВЕДНАГА, синхронно, преди всичко друго
            recordForm.setAttribute('data-submitting', 'true');
            isSaving = true;
            
            // Деактивиране на бутона ВЕДНАГА, преди всичко друго
            const originalText = submitButton ? submitButton.textContent : '';
            
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = typeof t !== 'undefined' ? 'Запазване...' : 'Запазване...';
            }
            
            // Деактивиране на цялата форма
            const formInputs = recordForm.querySelectorAll('input, select, textarea, button');
            formInputs.forEach(input => {
                if (input !== submitButton) {
                    input.disabled = true;
                }
            });
            
            // Извикване на функцията за запазване
            saveRecord().finally(() => {
                // Реактивиране на всичко след завършване
                recordForm.setAttribute('data-submitting', 'false');
                isSaving = false;
                
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
                
                formInputs.forEach(input => {
                    input.disabled = false;
                });
            });
        });
    }
    
    // Бутон за опресняване на данните
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', refreshData);
    }
    
    // Бутон за затваряне на модала за код на детето
    const modalChildCodeClose = document.getElementById('modalChildCodeClose');
    if (modalChildCodeClose) {
        modalChildCodeClose.addEventListener('click', closeChildCodeModal);
    }
}

// Функция за получаване на локално време в правилен формат за datetime-local input
// datetime-local input изисква ISO формат (YYYY-MM-DDTHH:mm), но браузърът автоматично
// показва стойността според локалните настройки на устройството
function getLocalDateTimeString(date = new Date()) {
    // Уверяваме се, че използваме локално време (не UTC)
    // getDate(), getMonth(), getHours() и т.н. вече връщат локално време
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    // Връщаме в ISO формат, но с локално време (без timezone offset)
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Функция за конвертиране на ISO datetime към локално време за datetime-local input
function convertToLocalDateTimeString(isoString) {
    if (!isoString) return '';
    
    // Създаваме Date обект от ISO string (което може да е UTC)
    const date = new Date(isoString);
    
    // Връщаме локалното време в правилния формат за datetime-local
    return getLocalDateTimeString(date);
}

// Централизирана функция за определяне на текущия език
function getCurrentLanguage() {
    let lang = 'bg'; // По подразбиране български
    try {
        // Първо проверяваме localStorage за актуална стойност
        const storedLang = localStorage.getItem('mamafood_language');
        if (storedLang) {
            lang = storedLang;
            // Синхронизираме currentLanguage в i18n.js ако е достъпен
            if (typeof currentLanguage !== 'undefined') {
                currentLanguage = storedLang;
            }
        } else if (typeof currentLanguage !== 'undefined' && currentLanguage) {
            // Fallback към currentLanguage от i18n.js
            lang = currentLanguage;
        }
    } catch (e) {
        console.warn('[getCurrentLanguage] Грешка при четене на език:', e);
        lang = 'bg'; // Fallback към български
    }
    return lang;
}

// Функция за форматиране на дата според езика
// Български: dd.mm.yyyy
// Английски: mm/dd/yyyy
function formatDateDDMMYYYY(date) {
    if (!date) return '';
    
    let d;
    let useUTC = false;
    
    if (typeof date === 'string') {
        // Ако е ISO string (с Z или завършва с timezone), използваме UTC методи
        if (date.includes('Z') || date.match(/[+-]\d{2}:\d{2}$/) || date.match(/^\d{4}-\d{2}-\d{2}T/)) {
            d = new Date(date);
            useUTC = true; // Използваме UTC методи за да получим правилния ден/месец от ISO string
        } else {
            d = new Date(date);
            useUTC = false;
        }
    } else {
        d = new Date(date);
        // Ако е Date обект от ISO string, проверим дали е UTC
        useUTC = date.toISOString && date.toISOString().includes('Z');
    }
    
    if (isNaN(d.getTime())) {
        console.warn('[formatDateDDMMYYYY] Невалидна дата:', date);
        return '';
    }
    
    // Използваме UTC методи ако датата е ISO string (от базата данни)
    // Това гарантира че получаваме правилния ден и месец независимо от timezone
    const day = useUTC ? String(d.getUTCDate()).padStart(2, '0') : String(d.getDate()).padStart(2, '0');
    const month = useUTC ? String(d.getUTCMonth() + 1).padStart(2, '0') : String(d.getMonth() + 1).padStart(2, '0');
    const year = useUTC ? d.getUTCFullYear() : d.getFullYear();
    
    // Определяне на текущия език
    const lang = getCurrentLanguage();
    
    // Форматиране според езика
    if (lang === 'en') {
        // Английски: mm/dd/yyyy
        return `${month}/${day}/${year}`;
    } else {
        // Български: dd.mm.yyyy (по подразбиране)
        return `${day}.${month}.${year}`;
    }
}

// Функция за форматиране на час във формат HH:MM (24-часов формат)
function formatTimeHHMM(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    // Проверяваме дали датата е ISO string (от базата данни)
    const isISOString = typeof date === 'string' && (date.includes('Z') || date.match(/[+-]\d{2}:\d{2}$/) || date.match(/^\d{4}-\d{2}-\d{2}T/));
    
    // Използваме UTC методи ако е ISO string, иначе локални методи
    const hours = isISOString ? String(d.getUTCHours()).padStart(2, '0') : String(d.getHours()).padStart(2, '0');
    const minutes = isISOString ? String(d.getUTCMinutes()).padStart(2, '0') : String(d.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

// Отваряне на модалния прозорец за добавяне
function openModalForAdd() {
    const modal = document.getElementById('recordModal');
    const modalTitle = document.getElementById('modalTitle');
    const recordForm = document.getElementById('recordForm');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    const datetimeFormatHint = document.getElementById('datetimeFormatHint');
    
    // Изчистване на формата
    recordForm.reset();
    
    // Обновяване на lang атрибута и format hint според текущия език
    const currentLang = typeof currentLanguage !== 'undefined' ? currentLanguage : (localStorage.getItem('mamafood_language') || 'bg');
    if (dateInput) {
        dateInput.setAttribute('lang', currentLang === 'en' ? 'en-US' : 'bg-BG');
    }
    if (datetimeFormatHint) {
        datetimeFormatHint.textContent = currentLang === 'en' ? 'Format: mm/dd/yyyy' : 'Формат: дд.мм.гггг';
    }
    
    // Задаване на текущата дата и час (ЛОКАЛНО време)
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (dateInput) dateInput.value = dateStr;
    if (timeInput) timeInput.value = timeStr;
    
    // Задаване на заглавие
    modalTitle.textContent = typeof t !== 'undefined' ? t('addPortion') : 'Добавяне на нова порция';
    
    // Изчистване на скрития input за ID
    document.getElementById('recordId').value = '';
    
    // Показване на модалния прозорец
    modal.style.display = 'flex';
}

// Отваряне на модалния прозорец за редактиране
function openModalForEdit(recordId) {
    const modal = document.getElementById('recordModal');
    const modalTitle = document.getElementById('modalTitle');
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    const datetimeFormatHint = document.getElementById('datetimeFormatHint');
    
    // Конвертиране на recordId към правилния тип (string или number)
    const record = records.find(r => String(r.id) === String(recordId) || r.id === recordId);
    
    if (!record) {
        console.error('Record not found:', recordId, 'Available records:', records.map(r => r.id));
        return;
    }
    
    // Обновяване на lang атрибута и format hint според текущия език
    const currentLang = typeof currentLanguage !== 'undefined' ? currentLanguage : (localStorage.getItem('mamafood_language') || 'bg');
    if (dateInput) {
        dateInput.setAttribute('lang', currentLang === 'en' ? 'en-US' : 'bg-BG');
    }
    if (datetimeFormatHint) {
        datetimeFormatHint.textContent = currentLang === 'en' ? 'Format: mm/dd/yyyy' : 'Формат: дд.мм.гггг';
    }
    
    // Попълване на формата с данните от записа
    document.getElementById('amount').value = Math.round(record.amount || 0);
    document.getElementById('situation').value = record.situation;
    
    // Конвертиране на datetime към локално време за date и time input полета
    const recordDate = new Date(record.datetime);
    const dateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(recordDate.getHours()).padStart(2, '0')}:${String(recordDate.getMinutes()).padStart(2, '0')}`;
    
    if (dateInput) dateInput.value = dateStr;
    if (timeInput) timeInput.value = timeStr;
    
    document.getElementById('notes').value = record.notes || '';
    document.getElementById('recordId').value = record.id;
    
    // Задаване на заглавие
    modalTitle.textContent = typeof t !== 'undefined' ? t('editPortion') : 'Редактиране на порция';
    
    // Показване на модалния прозорец
    modal.style.display = 'flex';
}

// Затваряне на модалния прозорец
function closeModal() {
    const modal = document.getElementById('recordModal');
    modal.style.display = 'none';
}

// API Configuration
// Определяне на API_BASE според протокола и hostname
const getAPIBase = () => {
    // Ако е file:// протокол или няма hostname, използвай localhost
    if (!window.location.hostname || window.location.protocol === 'file:') {
        return 'http://localhost:3000';
    }
    // Ако е localhost, 127.0.0.1 или локална мрежа (192.168.x.x, 10.x.x.x, 172.16-31.x.x), използвай localhost
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
        return 'http://localhost:3000';
    }
    // Ако е на inex-project.net или pci.inex-project.net, използвай Render.com backend
    if (hostname === 'inex-project.net' || hostname === 'pci.inex-project.net' || hostname.endsWith('.inex-project.net')) {
        // Backend е на Render.com, не на същия домейн
        const backendUrl = 'https://mamafood.onrender.com';
        console.log(`[getAPIBase] Hostname: ${hostname} -> Backend URL: ${backendUrl}`);
        return backendUrl;
    }
    // Иначе използвай production URL (Render.com)
    const backendUrl = 'https://mamafood.onrender.com';
    console.log(`[getAPIBase] Hostname: ${hostname} -> Backend URL: ${backendUrl}`);
    return backendUrl;
};

const API_BASE = getAPIBase();
// Експорт за глобална употреба (за uik.js и други модули)
window.API_BASE = API_BASE;
console.log(`[API Config] API_BASE е зададен на: ${API_BASE}`);
console.log(`[API Config] Window hostname: ${window.location.hostname}`);
console.log(`[API Config] Window origin: ${window.location.origin}`);

// Функция за получаване на следващия номер на порцията от сървъра
async function getNextRecordNumber(childCode) {
    try {
        // Уверяваме се, че кодът е в главни букви
        const upperChildCode = (childCode || '').toUpperCase();
        const response = await fetch(`${API_BASE}/api/records/${upperChildCode}/next-number`);
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
let isSaving = false;
async function saveRecord() {
    // Защита срещу множествено извикване - проверка (флагът вече е зададен в event listener-а)
    if (!isSaving) {
        console.warn('[saveRecord] ⚠️ Флагът не е зададен, но функцията е извикана! Задавам флага...');
        isSaving = true;
    }
    
    console.log('[saveRecord] 🚀 Започва запазване... (isSaving = true)');
    
    try {
        const recordId = document.getElementById('recordId').value;
        const amount = document.getElementById('amount').value;
        const situation = document.getElementById('situation').value;
        const dateInput = document.getElementById('dateInput');
        const timeInput = document.getElementById('timeInput');
        const notes = document.getElementById('notes').value;
        
        // Комбиниране на date и time в datetime
        const dateValue = dateInput ? dateInput.value : '';
        const timeValue = timeInput ? timeInput.value : '';
        let datetime = '';
        
        if (dateValue && timeValue) {
            datetime = `${dateValue}T${timeValue}`;
        } else {
            // Fallback към скритото datetime поле ако съществува
            const hiddenDatetime = document.getElementById('datetime');
            datetime = hiddenDatetime ? hiddenDatetime.value : '';
        }
        
        console.log('[saveRecord] Стойности от формата:', {
            recordId: recordId,
            amount: amount,
            situation: situation,
            dateValue: dateValue,
            timeValue: timeValue,
            datetime: datetime,
            notes: notes
        });
        
        // Валидация на задължителните полета
        if (!amount || !situation || !datetime || !dateValue || !timeValue) {
            console.error('[saveRecord] ❌ Липсват задължителни полета:', {
                has_amount: !!amount,
                has_situation: !!situation,
                has_date: !!dateValue,
                has_time: !!timeValue,
                has_datetime: !!datetime
            });
            showToast('Моля попълнете всички задължителни полета!');
            isSaving = false;
            return;
        }
        
        // Конвертиране на локално време към ISO формат
        if (datetime && !datetime.includes('Z') && !datetime.includes('+')) {
            const localDate = new Date(datetime);
            if (isNaN(localDate.getTime())) {
                console.error('[saveRecord] ❌ Невалидна дата:', datetime);
                showToast('Невалидна дата!');
                isSaving = false;
                return;
            }
            datetime = localDate.toISOString();
            console.log('[saveRecord] Конвертирана дата:', datetime);
        }
        
        // Създаване на нов запис
        const upperChildCode = (childCode || '').toUpperCase();
        const newRecord = {
            id: recordId || generateId(),
            child_code: upperChildCode,
            amount: parseInt(amount),
            situation: situation,
            datetime: datetime,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        
        // Добавяне или актуализиране на записа
        if (recordId) {
            // Редактиране - запазваме стария номер и child_code
            const existingRecord = records.find(r => String(r.id) === String(recordId));
            if (existingRecord) {
                newRecord.record_number = existingRecord.record_number || existingRecord.recordNumber;
                // Запазваме child_code от съществуващия запис (ако има)
                if (existingRecord.child_code) {
                    newRecord.child_code = existingRecord.child_code;
                }
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
                if (response.ok) {
                    // Успешно актуализиране - презареждаме записите от сървъра
                    await loadRecords();
                    showToast('Записът е актуализиран успешно!');
                } else {
                    console.warn('Failed to update record on server');
                    // Актуализираме локално поне
                    renderRecords();
                    saveRecords();
                }
            } catch (error) {
                console.warn('Could not sync update to server:', error);
                // Актуализираме локално поне
                renderRecords();
                saveRecords();
            }
        } else {
            // Нов запис - получаваме номер от сървъра или изчисляваме локално
            newRecord.record_number = await getNextRecordNumber(childCode);
            
            // Опит за синхронизация със сървъра
            try {
                // Уверяваме се, че кодът е в главни букви
                const upperChildCode = (childCode || '').toUpperCase();
                const requestUrl = `${API_BASE}/api/records`;
                const requestData = {
                    child_code: upperChildCode,
                    record_number: newRecord.record_number,
                    amount: newRecord.amount,
                    situation: newRecord.situation,
                    datetime: newRecord.datetime,
                    notes: newRecord.notes
                };
                
                console.log('[saveRecord] ========== ИЗПРАЩАНЕ НА POST ЗАЯВКА ==========');
                console.log('[saveRecord] URL:', requestUrl);
                console.log('[saveRecord] API_BASE:', API_BASE);
                console.log('[saveRecord] Данни за запис:', requestData);
                console.log('[saveRecord] JSON body:', JSON.stringify(requestData, null, 2));
                console.log('[saveRecord] ===============================================');
                
                let response;
                try {
                    response = await fetch(requestUrl, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });
                    console.log('[saveRecord] ✅ Заявката е изпратена успешно');
                } catch (fetchError) {
                    console.error('[saveRecord] ❌ Грешка при изпращане на fetch заявка:', fetchError);
                    throw fetchError; // Прехвърляме грешката към catch блока
                }
                
                console.log('[saveRecord] Response status:', response.status, response.statusText);
                console.log('[saveRecord] Response headers:', Object.fromEntries(response.headers.entries()));
                
                if (response.ok) {
                    const serverRecord = await response.json();
                    console.log('[saveRecord] ✅ Успешно записан в базата:', serverRecord);
                    newRecord.id = serverRecord.id;
                    newRecord.server_id = serverRecord.id;
                    
                    // Изчакваме малко за да се уверяваме че записът е напълно записан в базата
                    console.log('[saveRecord] Изчакване 500ms преди презареждане на записите...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Презареждаме записите от сървъра след добавяне
                    console.log('[saveRecord] Презареждане на записите от сървъра...');
                    await loadRecords();
                    showToast('Записът е добавен успешно!');
                } else {
                    const errorText = await response.text();
                    console.error('[saveRecord] ❌ Грешка при записване в базата:', response.status, errorText);
                    try {
                        const errorJson = JSON.parse(errorText);
                        console.error('[saveRecord] Детайли за грешката:', errorJson);
                    } catch (e) {
                        console.error('[saveRecord] Не може да се парсне грешката като JSON');
                    }
                    // Добавяме локално дори при грешка
                    records.push(newRecord);
                    renderRecords();
                    saveRecords();
                    const errorMsg = `Грешка при записване в базата: ${response.status}\n${errorText}\n\nПровери конзолата за повече детайли.`;
                    alert(errorMsg);
                    showToast('Записът е добавен локално (грешка при синхронизация)', 10000); // 10 секунди
                }
            } catch (error) {
                // Детайлно логиране на грешката
                console.error('[saveRecord] ❌ Грешка при изпращане на заявка:', error);
                console.error('[saveRecord] Error name:', error.name);
                console.error('[saveRecord] Error message:', error.message);
                console.error('[saveRecord] Stack trace:', error.stack);
                
                // Показваме грешката в alert за да не изчезне
                const errorMsg = `Грешка при записване: ${error.message || error.toString()}\n\nПровери конзолата за повече детайли.`;
                alert(errorMsg);
                
                // Логираме в конзолата за по-лесно debugging
                console.error('[saveRecord] ========== ДЕТАЙЛИ ЗА ГРЕШКАТА ==========');
                console.error('[saveRecord] API_BASE:', API_BASE);
                console.error('[saveRecord] Full URL:', `${API_BASE}/api/records`);
                console.error('[saveRecord] Request data:', {
                    child_code: upperChildCode,
                    record_number: newRecord.record_number,
                    amount: newRecord.amount,
                    situation: newRecord.situation,
                    datetime: newRecord.datetime,
                    notes: newRecord.notes
                });
                console.error('[saveRecord] ==========================================');
                
                // Добавяме локално дори при грешка
                records.push(newRecord);
                renderRecords();
                saveRecords();
                showToast('Записът е добавен локално (грешка при синхронизация)', 10000); // 10 секунди
            }
        }
        
        // Затваряне на модалния прозорец
        closeModal();
        
        // Актуализиране на статистиката
        updateStats();
    } finally {
        // Винаги освобождаваме флага, дори при грешка
        isSaving = false;
    }
}

// Изтриване на запис
async function deleteRecord(recordId) {
    // Конвертиране на recordId към правилния тип (string или number)
    if (confirm('Сигурни ли сте, че искате да изтриете този запис?')) {
        console.log(`[deleteRecord] Изтриване на запис ${recordId}`);
        console.log(`[deleteRecord] API_BASE: ${API_BASE}`);
        console.log(`[deleteRecord] Full URL: ${API_BASE}/api/records/${recordId}`);
        
        // Опит за изтриване от сървъра
        try {
            const response = await fetch(`${API_BASE}/api/records/${recordId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`[deleteRecord] Response status: ${response.status}`);
            console.log(`[deleteRecord] Response ok: ${response.ok}`);
            
            if (response.ok) {
                const result = await response.json();
                console.log(`[deleteRecord] ✅ Успешно изтриване от сървъра:`, result);
                // Успешно изтриване - презареждаме записите от сървъра
                await loadRecords();
                showToast('Записът е изтрит успешно!');
                updateStats();
                return;
            } else {
                // Опитваме се да прочетем грешката от response
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = await response.text() || errorMessage;
                }
                
                console.error(`[deleteRecord] ❌ Грешка при изтриване от сървъра:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorMessage
                });
                
                // Показваме грешката на потребителя
                showToast(`Грешка при изтриване от сървъра: ${errorMessage}`, 5000);
                
                // НЕ правим локално изтриване при грешка от сървъра
                // За да не се десинхронизират данните
                return;
            }
        } catch (error) {
            console.error('[deleteRecord] ❌ Грешка при изпращане на DELETE заявка:', error);
            console.error('[deleteRecord] Error name:', error.name);
            console.error('[deleteRecord] Error message:', error.message);
            
            // Показваме грешката на потребителя
            showToast(`Грешка при изтриване: ${error.message || error.toString()}`, 5000);
            
            // НЕ правим локално изтриване при network грешка
            // За да не се десинхронизират данните
            return;
        }
    }
}

// Визуализиране на записите
let isRendering = false;
let renderCallCount = 0;
function renderRecords() {
    renderCallCount++;
    console.log(`[renderRecords] Извикване #${renderCallCount}`);
    
    // СИНХРОНИЗИРАНЕ НА ЕЗИКА ПРЕДИ РЕНДИРАНЕ
    // Това гарантира, че винаги използваме правилния език от localStorage
    const storedLang = localStorage.getItem('mamafood_language') || 'bg';
    if (typeof currentLanguage !== 'undefined') {
        currentLanguage = storedLang;
    }
    // Извикваме getCurrentLanguage() за да се синхронизира и той
    getCurrentLanguage();
    
    // Предотвратяване на паралелно рендиране
    if (isRendering) {
        console.warn('[renderRecords] Вече се рендира, пропускам...');
        return;
    }
    isRendering = true;
    console.log(`[renderRecords] Стартиране на рендиране #${renderCallCount}`);
    
    try {
        console.log(`[renderRecords] Стартиране с ${records.length} записа`);
        console.log(`[renderRecords] Налични ситуации:`, situations.length);
        
        const recordsList = document.getElementById('recordsList');
        const expiredRecordsList = document.getElementById('expiredRecordsList');
        const expiredSection = document.getElementById('expiredSection');
        const emptyState = document.getElementById('emptyState');
        
        if (recordsList) {
            // Изчистване на списъците ПРЕДИ добавяне на нови записи
            const activeCountBefore = recordsList.querySelectorAll('.record-card').length;
            const expiredCountBefore = expiredRecordsList ? expiredRecordsList.querySelectorAll('.record-card').length : 0;
            console.log(`[renderRecords] Изчистване на DOM - Преди: ${activeCountBefore} активни, ${expiredCountBefore} изтекли`);
            
            recordsList.innerHTML = '';
            if (expiredRecordsList) expiredRecordsList.innerHTML = '';
            
            console.log(`[renderRecords] DOM изчистен`);
        }
        
        // Винаги показваме секцията за текущи порции
        const recordsSection = document.getElementById('recordsSection');
        if (recordsSection) {
            recordsSection.style.display = 'block';
        }
        
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        
        // Филтриране на записите по текущия child_code ПРЕДИ всичко друго
        const upperChildCode = (childCode || '').toUpperCase();
        console.log(`[renderRecords] Текущ код: "${upperChildCode}", Общо записи в масива: ${records.length}`);
        console.log(`[renderRecords] Детайли за всички записи:`, records.map(r => ({
            id: r.id,
            child_code: r.child_code,
            child_code_upper: (r.child_code || '').toUpperCase(),
            matches: ((r.child_code || '').toUpperCase() === upperChildCode)
        })));
        
        const filteredRecords = records.filter(r => {
            const recordCode = (r.child_code || '').toUpperCase();
            const matches = recordCode === upperChildCode;
            if (!matches) {
                console.log(`[renderRecords] Запис ${r.id} пропуснат: код "${recordCode}" !== "${upperChildCode}"`);
            }
            return matches;
        });
        
        console.log(`[renderRecords] Филтриране: ${records.length} общо записа, ${filteredRecords.length} за код ${upperChildCode}`);
        
        // Показване или скриване на съобщението за празен списък СЛЕД филтрирането
        if (filteredRecords.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (expiredSection) expiredSection.style.display = 'none';
            // Уверяваме се, че секцията за текущи порции се показва
            if (recordsSection) {
                recordsSection.style.display = 'block';
            }
            isRendering = false;
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }
        
        // Разделяне на активни и изтекли записи
        const activeRecords = [];
        const expiredRecords = [];
        const skippedRecords = [];
        
        filteredRecords.forEach((record, index) => {
            const recordDate = new Date(record.datetime);
            const isValidDate = !isNaN(recordDate.getTime());
            console.log(`[renderRecords] Обработване на запис ${index + 1}/${filteredRecords.length}:`, {
                id: record.id,
                child_code: record.child_code,
                situation: record.situation,
                datetime: record.datetime,
                datetime_parsed: isValidDate ? recordDate.toISOString() : 'INVALID',
                amount: record.amount,
                record_number: record.record_number
            });
            
            if (!record || !record.situation || !record.datetime) {
                console.warn(`[renderRecords] ⚠️ Запис ${record?.id} пропуснат: липсват полета`, {
                    hasRecord: !!record,
                    hasSituation: !!record?.situation,
                    hasDatetime: !!record?.datetime
                });
                skippedRecords.push({ reason: 'missing fields', record });
                return;
            }
            
            // Проверка за валидна дата
            if (isNaN(recordDate.getTime())) {
                console.warn(`[renderRecords] ⚠️ Запис ${record.id} пропуснат: невалидна дата "${record.datetime}"`);
                skippedRecords.push({ reason: 'invalid date', record });
                return;
            }
            
            const situation = situations.find(s => s.id === record.situation);
            if (!situation || situation.validityHours === undefined) {
                console.warn(`[renderRecords] Запис ${record.id} пропуснат: ситуация не е намерена или невалидна`, {
                    situationId: record.situation,
                    foundSituation: !!situation,
                    validityHours: situation?.validityHours,
                    availableSituations: situations.map(s => ({ id: s.id, name: s.name }))
                });
                skippedRecords.push({ 
                    reason: 'situation not found or invalid', 
                    record,
                    situationId: record.situation,
                    availableSituations: situations.map(s => s.id)
                });
                return;
            }
            
            try {
                // recordDate вече е създаден по-горе, използваме го директно
                // (проверката за валидност е направена на ред 1014-1019)
                const expiryDate = new Date(recordDate.getTime() + situation.validityHours * 60 * 60 * 1000);
                
                // Проверка дали е изтекъл
                if (now > expiryDate) {
                    // Показваме само изтекли записи, които са изтекли преди по-малко от 2 дена
                    // Записите по-стари от 2 дена ще се изтрият от cleanupExpiredRecords
                    const twoDaysAfterExpiry = new Date(expiryDate.getTime() + 2 * 24 * 60 * 60 * 1000);
                    if (now <= twoDaysAfterExpiry) {
                        // Показваме само ако не са изтекли преди повече от 2 дена
                        expiredRecords.push(record);
                    }
                    // Ако са по-стари от 2 дена, не ги показваме (ще се изтрият от cleanupExpiredRecords)
                } else {
                    activeRecords.push(record);
                }
            } catch (error) {
                console.warn('Error processing record:', record.id, error);
                skippedRecords.push({ reason: 'processing error', record, error: error.message });
            }
        });
        
        console.log(`[renderRecords] Активни записи: ${activeRecords.length}`);
        console.log(`[renderRecords] Изтекли записи: ${expiredRecords.length}`);
        console.log(`[renderRecords] Пропуснати записи: ${skippedRecords.length}`);
        console.log(`[renderRecords] Общо обработени: ${activeRecords.length + expiredRecords.length + skippedRecords.length} от ${filteredRecords.length} филтрирани`);
        
        // Подробна информация за пропуснатите записи
        if (skippedRecords.length > 0) {
            console.warn(`[renderRecords] ========== ПРОПУСНАТИ ЗАПИСИ ==========`);
            skippedRecords.forEach((skipped, idx) => {
                console.warn(`[renderRecords] Пропуснат запис ${idx + 1}:`, {
                    reason: skipped.reason,
                    recordId: skipped.record?.id,
                    child_code: skipped.record?.child_code,
                    situation: skipped.record?.situation,
                    datetime: skipped.record?.datetime,
                    amount: skipped.record?.amount,
                    record_number: skipped.record?.record_number,
                    error: skipped.error,
                    situationId: skipped.situationId,
                    availableSituations: skipped.availableSituations
                });
            });
            console.warn(`[renderRecords] ======================================`);
        }
        
        // Проверка за несъответствие в броя
        const totalProcessed = activeRecords.length + expiredRecords.length + skippedRecords.length;
        if (totalProcessed !== filteredRecords.length) {
            console.error(`[renderRecords] ⚠️ НЕСЪОТВЕТСТВИЕ: Обработени ${totalProcessed} записа, но филтрирани са ${filteredRecords.length}!`);
        }
        
        // Подробна информация за изтеклите записи
        if (expiredRecords.length > 0) {
            console.log(`[renderRecords] ========== ИЗТЕКЛИ ЗАПИСИ ==========`);
            expiredRecords.forEach((record, idx) => {
                const situation = situations.find(s => s.id === record.situation);
                const recordDate = new Date(record.datetime);
                const expiryDate = new Date(recordDate.getTime() + (situation?.validityHours || 0) * 60 * 60 * 1000);
                const hoursSinceExpiry = Math.floor((now - expiryDate) / (1000 * 60 * 60));
                console.log(`[renderRecords] Изтекъл запис ${idx + 1}: ID=${record.id}, ситуация=${record.situation} (${situation?.name || 'неизвестна'}), валидност=${situation?.validityHours || 0}ч, дата=${record.datetime}, изтичане=${expiryDate.toISOString()}, изтекъл преди ${hoursSinceExpiry} часа`);
            });
            console.log(`[renderRecords] ======================================`);
        } else {
            console.log(`[renderRecords] Няма изтекли записи - всички са активни или са по-стари от 2 дена`);
        }
        // Това вече е направено по-горе с по-подробна информация
        
        // Детайлна информация за всеки запис
        console.log(`[renderRecords] Детайли за активни записи:`, activeRecords.map(r => ({
            id: r.id,
            situation: r.situation,
            datetime: r.datetime,
            expiry: new Date(new Date(r.datetime).getTime() + (situations.find(s => s.id === r.situation)?.validityHours || 0) * 60 * 60 * 1000)
        })));
        console.log(`[renderRecords] Детайли за изтекли записи:`, expiredRecords.map(r => ({
            id: r.id,
            situation: r.situation,
            datetime: r.datetime,
            expiry: new Date(new Date(r.datetime).getTime() + (situations.find(s => s.id === r.situation)?.validityHours || 0) * 60 * 60 * 1000)
        })));
        
        // Актуализиране на масива records - запазваме ВСИЧКИ филтрирани записи (включително пропуснатите)
        // За да не загубим данни, запазваме всички филтрирани записи, не само активните и изтеклите
        records = [...filteredRecords];
        // Запазваме всички записи (включително за други кодове) в localStorage
        // НЕ извикваме saveRecords() тук, защото това ще извика renderRecords() отново и ще причини цикъл
        const allStoredRecords = localStorage.getItem(STORAGE_KEY);
        let allRecords = [];
        if (allStoredRecords) {
            try {
                allRecords = JSON.parse(allStoredRecords);
                // Премахваме старите записи за текущия код
                allRecords = allRecords.filter(r => {
                    const recordCode = (r.child_code || '').toUpperCase();
                    return recordCode !== upperChildCode;
                });
            } catch (e) {
                console.warn('[renderRecords] Грешка при парсване на старите записи:', e);
                allRecords = [];
            }
        }
        // Добавяме текущите записи
        allRecords = [...allRecords, ...records];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
        
        // Сортиране на активните записи по дата на изтичане (най-близките до изтичане първи)
        const sortedActiveRecords = [...activeRecords].sort((a, b) => {
            try {
                const situationA = situations.find(s => s.id === a.situation);
                const situationB = situations.find(s => s.id === b.situation);
                
                let expiryA = new Date(a.datetime);
                let expiryB = new Date(b.datetime);
                
                if (isNaN(expiryA.getTime())) expiryA = new Date(0);
                if (isNaN(expiryB.getTime())) expiryB = new Date(0);
                
                if (situationA && situationA.validityHours !== undefined) {
                    expiryA = new Date(new Date(a.datetime).getTime() + situationA.validityHours * 60 * 60 * 1000);
                }
                
                if (situationB && situationB.validityHours !== undefined) {
                    expiryB = new Date(new Date(b.datetime).getTime() + situationB.validityHours * 60 * 60 * 1000);
                }
                
                return expiryA - expiryB;
            } catch (error) {
                console.warn('Error sorting records:', error);
                return new Date(b.datetime) - new Date(a.datetime);
            }
        });
        
        // Сортиране на изтеклите записи по дата на изтичане (най-новите изтекли първи)
        const sortedExpiredRecords = [...expiredRecords].sort((a, b) => {
            try {
                const situationA = situations.find(s => s.id === a.situation);
                const situationB = situations.find(s => s.id === b.situation);
                
                let expiryA = new Date(a.datetime);
                let expiryB = new Date(b.datetime);
                
                if (isNaN(expiryA.getTime())) expiryA = new Date(0);
                if (isNaN(expiryB.getTime())) expiryB = new Date(0);
                
                if (situationA && situationA.validityHours !== undefined) {
                    expiryA = new Date(new Date(a.datetime).getTime() + situationA.validityHours * 60 * 60 * 1000);
                }
                
                if (situationB && situationB.validityHours !== undefined) {
                    expiryB = new Date(new Date(b.datetime).getTime() + situationB.validityHours * 60 * 60 * 1000);
                }
                
                return expiryB - expiryA; // Обратен ред за изтекли
            } catch (error) {
                console.warn('Error sorting expired records:', error);
                return new Date(b.datetime) - new Date(a.datetime);
            }
        });
        
        // Премахване на дублирани записи по ID
        // Използваме отделни Set-ове за активните и изтеклите, за да не премахваме валидни записи
        const seenActiveIds = new Set();
        const uniqueActiveRecords = sortedActiveRecords.filter(record => {
            if (seenActiveIds.has(record.id)) {
                console.warn(`[renderRecords] Дублиран активен запис с ID ${record.id}, пропускам...`);
                return false;
            }
            seenActiveIds.add(record.id);
            return true;
        });
        
        const seenExpiredIds = new Set();
        const uniqueExpiredRecords = sortedExpiredRecords.filter(record => {
            // Проверяваме дали записът вече не е в активните
            if (seenActiveIds.has(record.id)) {
                console.warn(`[renderRecords] Запис с ID ${record.id} е вече в активните, пропускам от изтеклите...`);
                return false;
            }
            if (seenExpiredIds.has(record.id)) {
                console.warn(`[renderRecords] Дублиран изтекъл запис с ID ${record.id}, пропускам...`);
                return false;
            }
            seenExpiredIds.add(record.id);
            return true;
        });
        
        console.log(`[renderRecords] След премахване на дублирания: ${uniqueActiveRecords.length} активни, ${uniqueExpiredRecords.length} изтекли`);
        console.log(`[renderRecords] Активни записи ID-та:`, uniqueActiveRecords.map(r => r.id));
        console.log(`[renderRecords] Изтекли записи ID-та:`, uniqueExpiredRecords.map(r => r.id));
        
        // Добавяне на активните записи
        console.log(`[renderRecords] Добавяне на ${uniqueActiveRecords.length} активни записа в DOM...`);
        let addedActiveCount = 0;
        uniqueActiveRecords.forEach((record, index) => {
            try {
                console.log(`[renderRecords] Добавяне на активен запис ${index + 1}/${uniqueActiveRecords.length}: ID=${record.id}, ситуация=${record.situation}, дата=${record.datetime}`);
                const card = createRecordCard(record);
                if (card) {
                    recordsList.appendChild(card);
                    addedActiveCount++;
                } else {
                    console.error(`[renderRecords] ❌ Неуспешно създаване на карта за запис ${record.id}`);
                }
            } catch (error) {
                console.error(`[renderRecords] ❌ Грешка при добавяне на активен запис ${record.id}:`, error);
            }
        });
        const actualActiveCount = recordsList.querySelectorAll('.record-card').length;
        console.log(`[renderRecords] Добавени активни записи в DOM: ${addedActiveCount} (очаквани: ${uniqueActiveRecords.length}, действителни в DOM: ${actualActiveCount})`);
        if (addedActiveCount !== uniqueActiveRecords.length) {
            console.error(`[renderRecords] ⚠️ НЕСЪОТВЕТСТВИЕ: Опитахме да добавим ${uniqueActiveRecords.length} активни записа, но успешно добавихме само ${addedActiveCount}!`);
        }
        
        // Добавяне на изтеклите записи
        if (expiredRecordsList && expiredSection) {
            if (uniqueExpiredRecords.length > 0) {
                expiredSection.style.display = 'block';
                console.log(`[renderRecords] ✅ Показване на секция "Изтекли порции" с ${uniqueExpiredRecords.length} записа`);
                console.log(`[renderRecords] Добавяне на ${uniqueExpiredRecords.length} изтекли записа в DOM...`);
                let addedExpiredCount = 0;
                uniqueExpiredRecords.forEach((record, index) => {
                    try {
                        console.log(`[renderRecords] Добавяне на изтекъл запис ${index + 1}/${uniqueExpiredRecords.length}: ID=${record.id}, ситуация=${record.situation}, дата=${record.datetime}`);
                        const card = createRecordCard(record);
                        if (card) {
                            expiredRecordsList.appendChild(card);
                            addedExpiredCount++;
                        } else {
                            console.error(`[renderRecords] ❌ Неуспешно създаване на карта за изтекъл запис ${record.id}`);
                        }
                    } catch (error) {
                        console.error(`[renderRecords] ❌ Грешка при добавяне на изтекъл запис ${record.id}:`, error);
                    }
                });
                const actualExpiredCount = expiredRecordsList.querySelectorAll('.record-card').length;
                console.log(`[renderRecords] ✅ Добавени изтекли записа в DOM: ${addedExpiredCount} (очаквани: ${uniqueExpiredRecords.length}, действителни в DOM: ${actualExpiredCount})`);
                if (addedExpiredCount !== uniqueExpiredRecords.length) {
                    console.error(`[renderRecords] ⚠️ НЕСЪОТВЕТСТВИЕ: Опитахме да добавим ${uniqueExpiredRecords.length} изтекли записа, но успешно добавихме само ${addedExpiredCount}!`);
                }
            } else {
                expiredSection.style.display = 'none';
                console.log(`[renderRecords] ❌ Няма изтекли записи - секцията "Изтекли порции" е скрита`);
            }
        } else {
            console.warn(`[renderRecords] ⚠️ expiredRecordsList или expiredSection не са намерени в DOM!`);
            if (!expiredRecordsList) console.warn(`[renderRecords] ⚠️ expiredRecordsList (id="expiredRecordsList") не е намерен`);
            if (!expiredSection) console.warn(`[renderRecords] ⚠️ expiredSection (id="expiredSection") не е намерен`);
        }
        
        // Уверяваме се, че секцията за текущи порции винаги се показва
        if (recordsSection) {
            recordsSection.style.display = 'block';
        }
        
        console.log(`[renderRecords] Секции: Текущи=${recordsSection?.style.display || 'default'}, Изтекли=${expiredSection?.style.display || 'none'}`);
        
        // Добавяне на event listeners за Edit и Delete бутони в активните записи
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
        
        // Добавяне на event listeners за Edit и Delete бутони в изтеклите записи
        if (expiredRecordsList) {
            expiredRecordsList.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const recordId = btn.getAttribute('data-record-id');
                    console.log('✏️ Edit clicked (event listener) for expired record:', recordId);
                    openModalForEdit(recordId);
                });
            });
            
            expiredRecordsList.querySelectorAll('.btn-delete').forEach(btn => {
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
    } catch (error) {
        console.error('[renderRecords] Грешка при рендиране:', error);
    } finally {
        isRendering = false;
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
    // Определяне на текущия език
    const lang = getCurrentLanguage();
    
    // Опитваме се да вземем от translations (от i18n.js)
    if (typeof translations !== 'undefined') {
        if (translations[lang] && translations[lang].conditions && translations[lang].conditions[situationId]) {
            return translations[lang].conditions[situationId].name;
        }
    }
    // Fallback към situations масива
    const situation = situations.find(s => s.id === situationId);
    return situation ? situation.name : (typeof t !== 'undefined' ? t('unknown') : 'Неизвестна');
}

// Функция за получаване на температура на ситуация от translations
function getSituationTemp(situationId) {
    // Определяне на текущия език
    const lang = getCurrentLanguage();
    
    // Опитваме се да вземем от translations (от i18n.js)
    if (typeof translations !== 'undefined') {
        if (translations[lang] && translations[lang].conditions && translations[lang].conditions[situationId]) {
            return translations[lang].conditions[situationId].temp;
        }
    }
    // Fallback към situations масива
    const situation = situations.find(s => s.id === situationId);
    return situation ? situation.temp : '';
}

// Функция за получаване на duration на ситуация от translations
function getSituationDuration(situationId) {
    // Определяне на текущия език
    const lang = getCurrentLanguage();
    
    // Опитваме се да вземем от translations (от i18n.js)
    if (typeof translations !== 'undefined') {
        if (translations[lang] && translations[lang].conditions && translations[lang].conditions[situationId]) {
            return translations[lang].conditions[situationId].duration;
        }
    }
    // Fallback - не показваме duration ако няма в translations
    return '';
}

// Създаване на карта за запис
function createRecordCard(record) {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.setAttribute('data-id', record.id);
    
    // Намиране на информация за ситуацията
    const unknownText = typeof t !== 'undefined' ? t('unknown') : 'Неизвестна';
    const situation = situations.find(s => s.id === record.situation) || {
        name: unknownText,
        temp: '',
        duration: 0,
        unit: 'hour',
        validityHours: 0
    };
    
    // Получаване на икона, име, температура и duration от translations
    const situationIcon = getSituationIcon(record.situation);
    const situationName = getSituationName(record.situation);
    const situationTemp = getSituationTemp(record.situation);
    const situationDuration = getSituationDuration(record.situation);
    
    // Определяне на вида (изцедена/приготвена) според ситуацията
    // Определяне на текущия език за правилна локализация
    const currentLang = getCurrentLanguage();
    
    const isFormula = record.situation && record.situation.startsWith('formula');
    let portionType;
    if (typeof t !== 'undefined' && typeof translations !== 'undefined' && translations[currentLang]) {
        portionType = isFormula ? translations[currentLang].prepared : translations[currentLang].pumped;
    } else {
        portionType = isFormula ? 'Приготвена' : 'Изцедена';
    }
    
    // Форматиране на дата и час - формат зависи от езика (bg: dd.mm.yyyy, en: mm/dd/yyyy)
    const recordDate = new Date(record.datetime);
    
    // Debug logging за датата
    if (record.id && record.id % 10 === 0) { // Log само за всеки 10-ти запис за да не е прекалено много
        console.log(`[createRecordCard] Дата за запис ${record.id}:`, {
            original: record.datetime,
            parsed: recordDate,
            localDate: recordDate.getDate(),
            localMonth: recordDate.getMonth() + 1,
            localYear: recordDate.getFullYear()
        });
    }
    
    // Форматиране на дата според езика (bg: dd.mm.yyyy, en: mm/dd/yyyy)
    // Предаваме оригиналния ISO string за правилно откриване на timezone
    const formattedDate = formatDateDDMMYYYY(record.datetime);
    
    // Форматиране на час във формат HH:MM (24-часов формат)
    // Предаваме оригиналния ISO string за правилно откриване на timezone
    const formattedTime = formatTimeHHMM(record.datetime);
    
    // Изчисляване на срок на годност
    const expiryDate = new Date(recordDate.getTime() + situation.validityHours * 60 * 60 * 1000);
    const now = new Date();
    
    // Определяне на статуса
    let status = '';
    let statusClass = '';
    
    // Определяне на статуса с правилна локализация
    if (now > expiryDate) {
        if (typeof translations !== 'undefined' && translations[currentLang]) {
            status = translations[currentLang].statusExpired || 'Изтекла';
        } else {
            status = 'Изтекла';
        }
        statusClass = 'status-expired';
    } else {
        // Изчисляване на оставащото време
        const remainingTime = expiryDate - now;
        const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
        
        if (remainingHours < 2) {
            if (typeof translations !== 'undefined' && translations[currentLang]) {
                status = translations[currentLang].statusWarning || 'Изтича скоро!';
            } else {
                status = 'Изтича скоро!';
            }
            statusClass = 'status-warning';
        } else {
            if (typeof translations !== 'undefined' && translations[currentLang]) {
                status = translations[currentLang].statusOK || 'Годна';
            } else {
                status = 'Годна';
            }
            statusClass = 'status-ok';
        }
    }
    
    // Форматиране на срока на годност - формат зависи от езика (bg: dd.mm.yyyy, en: mm/dd/yyyy)
    // Конвертираме към ISO string за правилно форматиране
    const expiryDateISO = expiryDate.toISOString();
    const expiryDateFormatted = formatDateDDMMYYYY(expiryDateISO);
    const expiryTimeFormatted = formatTimeHHMM(expiryDateISO);
    const formattedExpiry = `${expiryDateFormatted} ${expiryTimeFormatted}`;
    
    // Получаване на номера на порцията (ако има)
    const recordNumber = record.record_number || record.recordNumber || '';
    
    // Форматиране на количеството без дробна част
    const formattedAmount = Math.round(record.amount || 0);
    
    // Създаване на съдържанието на картата
    card.innerHTML = `
        <div class="record-header">
            <span class="record-icon">🍼</span>
            <span class="record-title">${formattedAmount} ml</span>
        </div>
        <div class="record-details">
            <div class="record-info">
                <span class="record-type">${portionType}</span>
                <span class="record-date">${formattedDate}</span>
                <span class="record-time">${formattedTime}</span>
            </div>
            <div class="record-situation">
                <span>${situationIcon} ${situationName}${situationTemp ? ' | ' + situationTemp : ''}${situationDuration ? ' | ' + situationDuration : ''}</span>
            </div>
        </div>
        <div class="record-expiry">
            <span class="record-expiry-label">${(typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].expiryLabel) ? translations[currentLang].expiryLabel : 'Срок на годност'}:</span>
            <span class="record-expiry-date">${formattedExpiry}</span>
            <span class="record-status ${statusClass}">${status}</span>
        </div>
        ${record.notes ? `<div class="record-notes">${record.notes}</div>` : ''}
        <div class="record-actions">
            ${recordNumber ? `<span class="record-number-display">#${recordNumber}</span>` : ''}
            <button class="btn-edit" data-record-id="${record.id}" title="${(typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].edit) ? translations[currentLang].edit : 'Редактирай'}">✏️</button>
            <button class="btn-delete" data-record-id="${record.id}" title="${(typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang].delete) ? translations[currentLang].delete : 'Изтрий'}">🗑️</button>
        </div>
    `;
    
    return card;
}

// Актуализиране на статистиката
function updateStats() {
    // Проверка дали елементите съществуват
    const totalRecordsElement = document.getElementById('totalRecords');
    const activeRecordsElement = document.getElementById('activeRecords');
    const expiringRecordsElement = document.getElementById('expiringRecords');
    
    // Проверка дали записите и ситуациите са заредени
    if (!records || !Array.isArray(records)) {
        records = [];
    }
    
    if (!situations || situations.length === 0) {
        // Ако ситуациите не са заредени, зареди ги
        loadSituations();
    }
    
    // Общ брой записи
    if (totalRecordsElement) {
        totalRecordsElement.textContent = records.length || 0;
    }
    
    // Активни и изтичащи скоро записи
    if (activeRecordsElement || expiringRecordsElement) {
        let activeCount = 0;
        let expiringCount = 0;
        
        if (records.length > 0 && situations.length > 0) {
            records.forEach(record => {
                if (!record || !record.situation || !record.datetime) {
                    return; // Пропускаме невалидни записи
                }
                
                // Намиране на информация за ситуацията
                const situation = situations.find(s => s.id === record.situation);
                if (situation && situation.validityHours !== undefined) {
                    try {
                        // Изчисляване на срок на годност
                        const recordDate = new Date(record.datetime);
                        if (isNaN(recordDate.getTime())) {
                            return; // Невалидна дата
                        }
                        
                        const expiryDate = new Date(recordDate.getTime() + situation.validityHours * 60 * 60 * 1000);
                        const now = new Date();
                        
                        if (now <= expiryDate) {
                            activeCount++;
                            
                            // Проверка дали изтича скоро (в рамките на 2 часа)
                            const remainingTime = expiryDate - now;
                            const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
                            
                            if (remainingHours < 2 && remainingHours >= 0) {
                                expiringCount++;
                            }
                        }
                    } catch (error) {
                        console.warn('Error calculating stats for record:', record.id, error);
                    }
                }
            });
        }
        
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

// Long-press refresh button for cache clear
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const refreshBtn = document.getElementById('btnRefresh');
        if (refreshBtn) {
            let pressTimer;
            refreshBtn.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    if (confirm('Изчистване на кеша и принудително презареждане?')) {
                        if (typeof clearAllCaches === 'function') {
                            clearAllCaches();
                        } else {
                            location.reload(true);
                        }
                    }
                }, 2000);
            });
            refreshBtn.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
            refreshBtn.addEventListener('touchcancel', () => {
                clearTimeout(pressTimer);
            });
        }
    });
}

// Функция за показване на toast съобщение
function showToast(message, duration = 3000) {
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
        toast.style.zIndex = '10000';
        toast.style.maxWidth = '80%';
        toast.style.wordWrap = 'break-word';
        document.body.appendChild(toast);
    }
    
    // Задаваме съобщението
    toast.textContent = message;
    
    // Показваме toast съобщението
    toast.style.display = 'block';
    
    // Скриваме toast съобщението след зададеното време
    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
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

// ============================================
// Child Code Management Functions
// ============================================

// Показване на модал за код на детето
function showChildCode() {
    const modal = document.getElementById('childCodeModal');
    const codeInput = document.getElementById('childCodeInputModal');
    const nameInput = document.getElementById('childNameInputModal');
    
    if (modal) {
        // Попълване на полетата с текущите стойности (ако има)
        if (codeInput) {
            codeInput.value = childCode || '';
            codeInput.setAttribute('data-generated', 'false'); // По подразбиране не е генериран
        }
        
        if (nameInput) {
            const childName = localStorage.getItem('mamafood_child_name') || '';
            nameInput.value = childName;
        }
        
        // Следване на промени в полето за код (за да знаем дали е редактирано ръчно)
        // Използваме once: true за да избегнем дублиране на listeners
        if (codeInput && !codeInput.hasAttribute('data-listener-added')) {
            codeInput.setAttribute('data-listener-added', 'true');
            codeInput.addEventListener('input', function() {
                // Ако потребителят редактира кодът ръчно, маркираме че не е генериран
                if (this.getAttribute('data-generated') === 'true') {
                    this.setAttribute('data-generated', 'false');
                }
            });
        }
        
        modal.style.display = 'flex';
    }
}

// Затваряне на модал за код на детето
function closeChildCodeModal() {
    const modal = document.getElementById('childCodeModal');
    const codeInput = document.getElementById('childCodeInputModal');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Премахване на атрибута за listener (за да може да се добави отново следващия път)
    if (codeInput) {
        codeInput.removeAttribute('data-listener-added');
    }
}

// Генериране на нов код на детето
function generateNewChildCode() {
    const codeInput = document.getElementById('childCodeInputModal');
    if (codeInput) {
        const newCode = generateChildCode();
        codeInput.value = newCode;
        codeInput.setAttribute('data-generated', 'true'); // Маркиране че е генериран
        codeInput.focus();
    }
}

// Запазване на код и име на детето
async function saveChildCodeAndName() {
    const codeInput = document.getElementById('childCodeInputModal');
    const nameInput = document.getElementById('childNameInputModal');
    
    if (!codeInput) return;
    
    const inputCode = codeInput.value.trim().toUpperCase();
    let finalName = nameInput ? nameInput.value.trim() : '';
    
    // Валидация на кода
    if (!inputCode || inputCode.length === 0) {
        alert('Моля, въведете код или генерирайте нов код.');
        codeInput.focus();
        return;
    }
    
    if (!/^[A-Za-z0-9]+$/.test(inputCode)) {
        alert('Невалиден код! Използвайте само букви и цифри.');
        codeInput.focus();
        return;
    }
    
    // Проверка дали кодът е различен от текущия (което означава споделяне или нов код)
    const isSharingCode = inputCode !== childCode;
    
    // Проверка дали кодът е генериран или въведен на ръка
    const isGenerated = codeInput.getAttribute('data-generated') === 'true';
    
    if (isSharingCode) {
        // Проверка дали кодът съществува в базата
        try {
            console.log(`[saveChildCodeAndName] Проверка на код "${inputCode}" в базата...`);
            const response = await fetch(`${API_BASE}/api/children/${inputCode}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log(`[saveChildCodeAndName] Response status: ${response.status}`);
            
            // Връщаме празен обект при 404, не грешка
            if (response.status === 404) {
                // Кодът не съществува в базата
                console.log(`[saveChildCodeAndName] Код "${inputCode}" не съществува в базата`);
                if (!isGenerated) {
                    // Кодът е въведен на ръка и не съществува - това е грешка
                    alert(`Кодът "${inputCode}" не съществува в базата данни!\n\nАко искате да споделяте съществуваща база, моля въведете правилен код.\nАко искате да създадете нов код, натиснете "Генерирай нов код".`);
                    codeInput.focus();
                    return;
                }
                
                // Кодът е генериран - създаваме нов запис нормално
                console.log(`[saveChildCodeAndName] Създаване на нов запис за код "${inputCode}"`);
                const createResponse = await fetch(`${API_BASE}/api/children`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        child_code: inputCode,
                        name: finalName || null
                    })
                });
                
                if (!createResponse.ok) {
                    throw new Error('Не може да се създаде нов код');
                }
                console.log(`[saveChildCodeAndName] Нов запис създаден успешно`);
            } else if (response.ok) {
                // Кодът съществува - зареждаме информацията
                console.log(`[saveChildCodeAndName] Код "${inputCode}" съществува в базата`);
                const childInfo = await response.json();
                if (childInfo && childInfo.name) {
                    // Актуализираме името ако има в базата
                    if (nameInput) {
                        nameInput.value = childInfo.name;
                    }
                    finalName = childInfo.name;
                }
            } else {
                // Други HTTP статуси - не е критично, продължаваме
                console.warn(`[saveChildCodeAndName] Неочакван статус ${response.status}, продължаваме...`);
            }
        } catch (error) {
            console.warn('[saveChildCodeAndName] Грешка при проверка на кода:', error);
            
            // Ако не можем да се свържем с backend-а, просто продължаваме
            // (може да е офлайн режим или backend не работи)
            console.log('[saveChildCodeAndName] Продължаваме без проверка на базата');
            
            // НЕ показваме диалог - просто продължаваме
            // Потребителят може да използва кода дори и да не можем да проверим в базата
        }
    }
    
    // Запазване на код и име
    const oldCode = childCode;
    childCode = inputCode;
    localStorage.setItem('mamafood_child_code', childCode);
    
    if (finalName) {
        localStorage.setItem('mamafood_child_name', finalName);
    } else {
        localStorage.removeItem('mamafood_child_name');
    }
    
    // Актуализиране на display-а
    updateChildCodeTooltip();
    
    // Запазване на името в базата (ако има)
    if (finalName) {
        try {
            await fetch(`${API_BASE}/api/children`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    child_code: childCode,
                    name: finalName
                })
            });
        } catch (error) {
            console.warn('Could not save child name to server:', error);
        }
    }
    
    // Презареждане на записите с новия код
    await loadRecords();
    
    // Показване на съобщение
    if (isSharingCode) {
        showToast(`Кодът е променен на ${childCode}. Сега ще виждате записите за това дете.`);
    } else {
        showToast(`Кодът и името са запазени успешно!`);
    }
    
    // Затваряне на модала
    closeChildCodeModal();
}

// Копиране на кода на детето
function copyChildCode() {
    navigator.clipboard.writeText(childCode).then(() => {
        showToast('Кодът е копиран в клипборда!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback за стари браузъри
        const textArea = document.createElement('textarea');
        textArea.value = childCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Кодът е копиран!');
    });
}

// Смяна на кода на детето
function changeChildCode() {
    const newCode = prompt('Въведете нов код на детето:', childCode);
    if (newCode && newCode.trim().length > 0 && /^[A-Za-z0-9]+$/.test(newCode)) {
        const oldCode = childCode;
        childCode = newCode.trim().toUpperCase();
        localStorage.setItem('mamafood_child_code', childCode);
        
        // Актуализираме tooltip-а
        updateChildCodeTooltip();
        
        // Презареждаме записите с новия код
        loadRecords();
        
        showToast(`Кодът е променен от ${oldCode} на ${childCode}`);
        closeChildCodeModal();
    } else if (newCode) {
        alert('Невалиден код! Използвайте само букви и цифри.');
    }
}

// Въвеждане на код на детето (за споделяне между устройства)
function setChildCode() {
    const inputCode = prompt('Въведете код на детето за споделяне:', '');
    if (inputCode && inputCode.trim().length > 0 && /^[A-Za-z0-9]+$/.test(inputCode)) {
        const oldCode = childCode;
        childCode = inputCode.trim().toUpperCase();
        localStorage.setItem('mamafood_child_code', childCode);
        
        // Актуализираме tooltip-а
        updateChildCodeTooltip();
        
        // Презареждаме записите с новия код
        loadRecords();
        
        showToast(`Кодът е променен на ${childCode}. Сега ще виждате записите за това дете.`);
        closeChildCodeModal();
    } else if (inputCode) {
        alert('Невалиден код! Използвайте само букви и цифри.');
    }
}

// Въвеждане на код от input полето
function setChildCodeFromInput() {
    const input = document.getElementById('childCodeInput');
    if (!input) return;
    
    const inputCode = input.value.trim().toUpperCase();
    if (inputCode && inputCode.length > 0 && /^[A-Za-z0-9]+$/.test(inputCode)) {
        const oldCode = childCode;
        childCode = inputCode;
        localStorage.setItem('mamafood_child_code', childCode);
        
        // Актуализираме tooltip-а
        updateChildCodeTooltip();
        
        // Изчистваме input полето
        input.value = '';
        
        // Презареждаме записите с новия код
        loadRecords();
        
        // Обновяваме display-а
        const display = document.getElementById('childCodeDisplay');
        if (display) {
            display.textContent = childCode;
        }
        
        showToast(`Кодът е променен на ${childCode}. Сега ще виждате записите за това дете.`);
    } else {
        alert('Невалиден код! Използвайте само букви и цифри.');
        input.focus();
    }
}

// Запазване на името на детето
async function saveChildName() {
    const input = document.getElementById('childNameInput');
    if (!input) return;
    
    const childName = input.value.trim();
    
    // Запазване локално
    if (childName) {
        localStorage.setItem('mamafood_child_name', childName);
    } else {
        localStorage.removeItem('mamafood_child_name');
    }
    
    // Актуализиране на display-а
    updateChildCodeTooltip();
    
    // Запазване към backend-а
    try {
        const response = await fetch(`${API_BASE}/api/children`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                child_code: childCode,
                name: childName || null
            })
        });
        
        if (response.ok) {
            showToast(childName ? `Името "${childName}" е запазено успешно!` : 'Името е премахнато.');
        } else {
            console.warn('Failed to save child name on server');
            showToast(childName ? `Името е запазено локално (${childName})` : 'Името е премахнато локално.');
        }
    } catch (error) {
        console.warn('Could not sync child name to server:', error);
        showToast(childName ? `Името е запазено локално (${childName})` : 'Името е премахнато локално.');
    }
}

// Експорт на данни
function exportData() {
    const data = {
        child_code: childCode,
        records: records,
        export_date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mamafood_${childCode}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Данните са експортирани!');
}

// Импорт на данни
function importData(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.child_code && data.records) {
                // Питаме потребителя дали иска да импортира данните
                if (confirm(`Импортиране на ${data.records.length} записа за дете ${data.child_code}?`)) {
                    // Синхронизираме с backend-а
                    data.records.forEach(async (record) => {
                        try {
                            await fetch(`${API_BASE}/api/records`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    child_code: data.child_code,
                                    record_number: record.record_number || record.recordNumber,
                                    amount: record.amount,
                                    situation: record.situation,
                                    datetime: record.datetime,
                                    notes: record.notes
                                })
                            });
                        } catch (err) {
                            console.error('Error importing record:', err);
                        }
                    });
                    
                    // Презареждаме записите
                    setTimeout(() => {
                        loadRecords();
                        showToast('Данните са импортирани успешно!');
                    }, 1000);
                }
            } else {
                alert('Невалиден файл за импорт!');
            }
        } catch (err) {
            console.error('Error parsing import file:', err);
            alert('Грешка при импортиране на файла!');
        }
    };
    reader.readAsText(file);
}

// ============================================
// Push Notifications Functions
// ============================================

// Subscribe to push notifications
async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Push notifications не се поддържат от този браузър.');
        return;
    }

    try {
        // Проверка дали Service Worker е регистриран
        let registration = null;
        
        // Опитваме се да получим активна регистрация
        try {
            registration = await navigator.serviceWorker.ready;
        } catch (e) {
            console.warn('[subscribeToPush] Service Worker не е готов, опитвам се да го регистрирам...');
            
            // Опитваме се да регистрираме Service Worker
            if (window.location.protocol === 'file:') {
                alert('Service Worker не може да работи с file:// протокол. Използвай HTTP сървър (например http://localhost:8000)');
                return;
            }
            
            registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('[subscribeToPush] Service Worker регистриран:', registration);
            
            // Изчакваме активирането
            await new Promise((resolve) => {
                if (registration.installing) {
                    registration.installing.addEventListener('statechange', function() {
                        if (this.state === 'activated') {
                            resolve();
                        }
                    });
                } else if (registration.waiting) {
                    registration.waiting.addEventListener('statechange', function() {
                        if (this.state === 'activated') {
                            resolve();
                        }
                    });
                } else if (registration.active) {
                    resolve();
                }
            });
            
            // Изчакваме да стане ready
            registration = await navigator.serviceWorker.ready;
        }
        
        if (!registration || !registration.active) {
            throw new Error('Service Worker не е активен');
        }
        
        console.log('[subscribeToPush] Service Worker е готов:', registration);
        
        // Get VAPID public key from server
        const response = await fetch(`${API_BASE}/api/push/publicKey`);
        if (!response.ok) {
            throw new Error('Не може да се получи публичен ключ');
        }
        
        const { publicKey } = await response.json();
        
        // Convert VAPID key to Uint8Array
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        
        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });
        
        // Send subscription to server
        const subscribeResponse = await fetch(`${API_BASE}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                child_code: childCode,
                subscription: subscription
            })
        });
        
        if (subscribeResponse.ok) {
            showToast('Абонирането за известия е успешно!');
            localStorage.setItem('push_subscribed', 'true');
            updatePushButtonStatus();
        } else {
            throw new Error('Не може да се запази абонаментът');
        }
    } catch (error) {
        console.error('Push subscription error:', error);
        if (error.name === 'NotAllowedError') {
            alert('Известията са отказани. Моля, разрешете ги в настройките на браузъра.');
        } else {
            alert('Грешка при абониране: ' + error.message);
        }
    }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Test push notification
async function testPush() {
    try {
        // Check if already subscribed
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // Not subscribed yet - ask to subscribe
            if (confirm('Не сте абонирани за известия. Да се абонирате ли?')) {
                await subscribeToPush();
                subscription = await registration.pushManager.getSubscription();
            } else {
                return;
            }
        }
        
        // Send test notification
        const response = await fetch(`${API_BASE}/api/push/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                child_code: childCode,
                title: 'МАМАФООД - Тест',
                body: 'Това е тестово известие от приложението!'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast(`Тестово известие изпратено! (${result.results.length} устройства)`);
        } else {
            throw new Error('Не може да се изпрати тестово известие');
        }
    } catch (error) {
        console.error('Test push error:', error);
        alert('Грешка при тестване на известия: ' + error.message);
    }
}

// Update push button status
async function updatePushButtonStatus() {
    const btn = document.getElementById('btnPushStatus');
    if (!btn) return;
    
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            btn.title = 'Известия: Активни (натисни за тест)';
            btn.style.opacity = '1';
        } else {
            btn.title = 'Известия: Неактивни (натисни за абониране)';
            btn.style.opacity = '0.6';
        }
    } catch (error) {
        btn.title = 'Известия: Недостъпни';
        btn.style.opacity = '0.4';
    }
}

// ============================================
// Expiry Check Functions
// ============================================

let expiryCheckInterval = null;

// Стартиране на проверката за изтичащи порции
function startExpiryCheck() {
    // Проверяваме веднага
    checkExpiringPortions();
    
    // Проверяваме всяка минута
    if (expiryCheckInterval) {
        clearInterval(expiryCheckInterval);
    }
    
    expiryCheckInterval = setInterval(() => {
        checkExpiringPortions();
    }, 60000); // 60 секунди = 1 минута
}

// Проверка за порции, които изтичат в следващите 15 минути
async function checkExpiringPortions() {
    if (!records || records.length === 0 || !situations || situations.length === 0) {
        return;
    }
    
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    
    // Зареждане на списъка с порции, за които вече е изпратено известие
    const notifiedPortions = JSON.parse(localStorage.getItem('mamafood_notified_portions') || '[]');
    
    const expiringPortions = [];
    
    records.forEach(record => {
        if (!record || !record.situation || !record.datetime) {
            return;
        }
        
        const situation = situations.find(s => s.id === record.situation);
        if (!situation || situation.validityHours === undefined) {
            return;
        }
        
        try {
            const recordDate = new Date(record.datetime);
            if (isNaN(recordDate.getTime())) {
                return;
            }
            
            const expiryDate = new Date(recordDate.getTime() + situation.validityHours * 60 * 60 * 1000);
            
            // Проверка дали порцията изтича в следващите 15 минути
            if (expiryDate > now && expiryDate <= fifteenMinutesFromNow) {
                // Проверка дали вече е изпратено известие за тази порция
                const recordKey = `${record.id}_${expiryDate.getTime()}`;
                if (!notifiedPortions.includes(recordKey)) {
                    expiringPortions.push({
                        record: record,
                        expiryDate: expiryDate,
                        recordKey: recordKey
                    });
                }
            }
        } catch (error) {
            console.warn('Error checking expiry for record:', record.id, error);
        }
    });
    
    // Изпращане на известия за всички намерени порции
    if (expiringPortions.length > 0) {
        for (const item of expiringPortions) {
            await sendExpiryNotification(item.record, item.expiryDate, item.recordKey);
        }
    }
}

// Изпращане на push notification за изтичаща порция
async function sendExpiryNotification(record, expiryDate, recordKey) {
    try {
        // Проверка дали има активна push subscription
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // Няма активна subscription, използваме локално известие
            if ('Notification' in window && Notification.permission === 'granted') {
                const situation = situations.find(s => s.id === record.situation);
                const situationName = getSituationName(record.situation);
                const minutesLeft = Math.floor((expiryDate - new Date()) / (1000 * 60));
                
                const recordNumber = record.record_number || record.recordNumber || '';
                const numberText = recordNumber ? `#${recordNumber} ` : '';
                
                new Notification('МАМАФООД - Изтича скоро!', {
                    body: `${numberText}${record.amount}ml ${situationName} изтича след ${minutesLeft} минути`,
                    icon: '/manifest.json',
                    badge: '/manifest.json',
                    tag: `expiry-${record.id}`,
                    requireInteraction: false
                });
            }
            return;
        }
        
        // Опит за изпращане на push notification чрез backend-а
        try {
            const response = await fetch(`${API_BASE}/api/push/expiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    child_code: childCode,
                    record_id: record.id,
                    record_number: record.record_number || record.recordNumber || null,
                    amount: record.amount,
                    situation: record.situation,
                    expiry_date: expiryDate.toISOString(),
                    minutes_left: Math.floor((expiryDate - new Date()) / (1000 * 60))
                })
            });
            
            if (response.ok) {
                // Маркиране на порцията като известие изпратено
                const notifiedPortions = JSON.parse(localStorage.getItem('mamafood_notified_portions') || '[]');
                if (!notifiedPortions.includes(recordKey)) {
                    notifiedPortions.push(recordKey);
                    localStorage.setItem('mamafood_notified_portions', JSON.stringify(notifiedPortions));
                }
                return;
            }
        } catch (error) {
            console.log('Backend push not available, using local notification');
        }
        
        // Fallback: използваме локално известие ако backend-ът не е достъпен
        if ('Notification' in window && Notification.permission === 'granted') {
            const situation = situations.find(s => s.id === record.situation);
            const situationName = getSituationName(record.situation);
            const minutesLeft = Math.floor((expiryDate - new Date()) / (1000 * 60));
            
            const recordNumber = record.record_number || record.recordNumber || '';
            const numberText = recordNumber ? `#${recordNumber} ` : '';
            
            new Notification('МАМАФООД - Изтича скоро!', {
                body: `${numberText}${record.amount}ml ${situationName} изтича след ${minutesLeft} минути`,
                icon: '/manifest.json',
                badge: '/manifest.json',
                tag: `expiry-${record.id}`,
                requireInteraction: false
            });
            
            // Маркиране на порцията като известие изпратено
            const notifiedPortions = JSON.parse(localStorage.getItem('mamafood_notified_portions') || '[]');
            if (!notifiedPortions.includes(recordKey)) {
                notifiedPortions.push(recordKey);
                localStorage.setItem('mamafood_notified_portions', JSON.stringify(notifiedPortions));
            }
        }
    } catch (error) {
        console.error('Error sending expiry notification:', error);
    }
}

// Изчистване на стари записи от списъка с известия (по-стари от 1 час)
function cleanupNotifiedPortions() {
    const notifiedPortions = JSON.parse(localStorage.getItem('mamafood_notified_portions') || '[]');
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    const cleaned = notifiedPortions.filter(key => {
        const timestamp = parseInt(key.split('_')[1]);
        return timestamp > oneHourAgo;
    });
    
    localStorage.setItem('mamafood_notified_portions', JSON.stringify(cleaned));
}

// Изчистване на изтекли порции, по-стари от 2 дена
function cleanupExpiredRecords() {
    if (!records || records.length === 0 || !situations || situations.length === 0) {
        return;
    }
    
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    let hasChanges = false;
    const cleanedRecords = records.filter(record => {
        if (!record || !record.situation || !record.datetime) {
            return true; // Запазваме невалидните записи
        }
        
        const situation = situations.find(s => s.id === record.situation);
        if (!situation || situation.validityHours === undefined) {
            return true; // Запазваме записите без валидна ситуация
        }
        
        try {
            const recordDate = new Date(record.datetime);
            if (isNaN(recordDate.getTime())) {
                return true; // Запазваме записите с невалидна дата
            }
            
            const expiryDate = new Date(recordDate.getTime() + situation.validityHours * 60 * 60 * 1000);
            
            // Изтриваме само ако е изтекъл преди повече от 2 дена
            if (now > expiryDate && expiryDate < twoDaysAgo) {
                hasChanges = true;
                return false; // Изтриваме го
            }
            
            return true; // Запазваме го
        } catch (error) {
            console.warn('Error checking expiry for cleanup:', record.id, error);
            return true; // Запазваме при грешка
        }
    });
    
    if (hasChanges) {
        records = cleanedRecords;
        saveRecords();
        renderRecords();
        updateStats();
    }
}

// Изнасяне на функциите в глобалния обхват (незабавно, не в setTimeout)
if (typeof showChildCode === 'function') {
    window.showChildCode = showChildCode;
}
if (typeof closeChildCodeModal === 'function') {
    window.closeChildCodeModal = closeChildCodeModal;
}
if (typeof generateNewChildCode === 'function') {
    window.generateNewChildCode = generateNewChildCode;
}
if (typeof saveChildCodeAndName === 'function') {
    window.saveChildCodeAndName = saveChildCodeAndName;
}
if (typeof exportData === 'function') {
    window.exportData = exportData;
}
if (typeof importData === 'function') {
    window.importData = importData;
}
if (typeof testPush === 'function') {
    window.testPush = testPush;
}
if (typeof subscribeToPush === 'function') {
    window.subscribeToPush = subscribeToPush;
}
if (typeof refreshData === 'function') {
    window.refreshData = refreshData;
}

// Също така добавяме в setTimeout за да се гарантира че е достъпна
setTimeout(() => {
    if (typeof showChildCode === 'function') {
        window.showChildCode = showChildCode;
    }
    if (typeof refreshData === 'function') {
        window.refreshData = refreshData;
    }
    window.closeChildCodeModal = closeChildCodeModal;
    window.generateNewChildCode = generateNewChildCode;
    window.saveChildCodeAndName = saveChildCodeAndName;
    window.exportData = exportData;
    window.importData = importData;
    console.log('✅ Child code functions exported');
}, 100);