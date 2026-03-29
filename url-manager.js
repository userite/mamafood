// ============================================
// URL Manager - Quick Links System
// Сега използва базата данни вместо localStorage
// ============================================

/**
 * Взима API base URL (същият като за UIK)
 */
function getURLAPIBase() {
    // Проверяваме дали има глобално дефиниран API_BASE
    if (typeof window !== 'undefined' && window.API_BASE) {
        return window.API_BASE;
    }
    // Fallback към локална дефиниция
    return 'http://localhost:3000';
}

/**
 * Зарежда списъка с URL адреси от базата данни
 * @returns {Promise<Array>} Масив с обекти {id, name, url, created_at}
 */
async function loadURLs() {
    try {
        const uik = getUIK();
        if (!uik) {
            console.warn('[loadURLs] Няма UIK, връщане на празен списък');
            return [];
        }
        
        const response = await fetch(`${getURLAPIBase()}/api/uik/${uik}/urls`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // UIK не съществува - връщаме празен списък
                return [];
            }
            throw new Error('Грешка при зареждане на URL-ите');
        }
        
        return await response.json();
    } catch (error) {
        console.error('[loadURLs] Грешка:', error);
        return [];
    }
}

/**
 * Добавя нов URL адрес в базата данни
 * @param {string} name - Име на приложението/сайта
 * @param {string} url - URL адрес
 * @returns {Promise<Object>} Добавеният URL обект
 */
async function addURL(name, url) {
    try {
        const uik = getUIK();
        if (!uik) {
            throw new Error('Няма UIK. Моля, влезте в системата отново.');
        }
        
        const response = await fetch(`${getURLAPIBase()}/api/uik/${uik}/urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name.trim(),
                url: url.trim()
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Грешка при добавяне на URL');
        }
        
        return await response.json();
    } catch (error) {
        console.error('[addURL] Грешка:', error);
        throw error;
    }
}

/**
 * Изтрива URL адрес от базата данни
 * @param {number} id - ID на URL адреса
 * @returns {Promise<void>}
 */
async function deleteURL(id) {
    try {
        const uik = getUIK();
        if (!uik) {
            throw new Error('Няма UIK. Моля, влезте в системата отново.');
        }
        
        const response = await fetch(`${getURLAPIBase()}/api/uik/${uik}/urls/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Грешка при изтриване на URL');
        }
        
        return await response.json();
    } catch (error) {
        console.error('[deleteURL] Грешка:', error);
        throw error;
    }
}

/**
 * Рендира списъка с URL адреси
 */
async function renderURLList() {
    const urlList = document.getElementById('url-list');
    const emptyMessage = document.getElementById('url-empty-message');
    
    if (!urlList) return;
    
    // Показване на индикатор за зареждане
    urlList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Зареждане...</div>';
    
    try {
        const urls = await loadURLs();
        
        // Изчистване на списъка
        urlList.innerHTML = '';
        
        if (urls.length === 0) {
            if (emptyMessage) emptyMessage.style.display = 'block';
            return;
        }
        
        if (emptyMessage) emptyMessage.style.display = 'none';
        
        // Добавяне на всеки URL като бутон
        urls.forEach(url => {
            const urlItem = document.createElement('div');
            urlItem.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem; background: #f9f9f9; border-radius: 8px; border: 1px solid #e0e0e0;';
            
            const urlButton = document.createElement('button');
            urlButton.type = 'button';
            urlButton.className = 'btn btn-primary';
            urlButton.style.cssText = 'flex: 1; text-align: left; justify-content: flex-start;';
            
            // Проверка дали е специален URL за стартиране на приложението
            const isAppStart = url.url === 'app://start' || url.url === 'app://user-platform' || url.url.startsWith('javascript:');
            
            if (isAppStart) {
                // За приложението показваме по-различен текст
                urlButton.innerHTML = `<strong>${escapeHtml(url.name)}</strong><br><small style="opacity: 0.8;">Отваря приложението в нов tab</small>`;
                
                urlButton.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Отваряне на приложението (mamafood.html - standalone версия) в нов tab
                    // ВИНАГИ използваме mamafood.html за standalone версия без UIK система
                    let appUrl;
                    
                    if (window.location.protocol === 'file:') {
                        // За file:// протокол - използваме относителен път от текущата директория
                        const currentPath = window.location.pathname;
                        const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                        appUrl = currentDir + 'mamafood.html';
                    } else {
                        // За http/https - винаги използваме абсолютен път от root директорията
                        // Използваме mamafood.html (standalone версия без UIK система)
                        appUrl = window.location.origin + '/mamafood.html';
                    }
                    
                    // ПРОВЕРКА: Уверяваме се че използваме mamafood.html, не index.html
                    if (appUrl.includes('index.html')) {
                        console.error('[URL Manager] ❌ ГРЕШКА: URL съдържа index.html вместо mamafood.html!');
                        appUrl = appUrl.replace('index.html', 'mamafood.html');
                        console.log('[URL Manager] ✅ Коригиран URL:', appUrl);
                    }
                    
                    console.log('[URL Manager] ============================================');
                    console.log('[URL Manager] Отваряне на MAMAFOOD приложението');
                    console.log('[URL Manager] - URL name:', url.name);
                    console.log('[URL Manager] - URL value:', url.url);
                    console.log('[URL Manager] - Текуща локация:', window.location.href);
                    console.log('[URL Manager] - Origin:', window.location.origin);
                    console.log('[URL Manager] - Pathname:', window.location.pathname);
                    console.log('[URL Manager] - Protocol:', window.location.protocol);
                    console.log('[URL Manager] - Final URL:', appUrl);
                    console.log('[URL Manager] - Проверка за index.html:', appUrl.includes('index.html') ? '❌ НАМЕРЕН!' : '✅ OK');
                    console.log('[URL Manager] ============================================');
                    
                    // Опитваме се с window.open() първо (ако работи)
                    try {
                        console.log('[URL Manager] Опит с window.open()...');
                        const newWindow = window.open(appUrl, '_blank', 'noopener,noreferrer');
                        
                        if (newWindow && !newWindow.closed) {
                            console.log('[URL Manager] ✅ window.open() успешен, нов прозорец отворен');
                            return;
                        } else {
                            console.warn('[URL Manager] ⚠️ window.open() върна null или прозорецът е затворен');
                        }
                    } catch (error) {
                        console.error('[URL Manager] ❌ window.open() неуспешен:', error);
                        console.log('[URL Manager] Опитвам с <a> таг...');
                    }
                    
                    // Ако window.open() не работи, използваме <a> таг
                    const link = document.createElement('a');
                    link.href = appUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    
                    // Добавяме линка в DOM, кликваме го, и след това го премахваме
                    document.body.appendChild(link);
                    
                    // Проверка дали линкът е правилно настроен
                    console.log('[URL Manager] - Link href:', link.href);
                    console.log('[URL Manager] - Link target:', link.target);
                    console.log('[URL Manager] - Link complete href:', link.href);
                    
                    // Използваме директно click() метода
                    console.log('[URL Manager] Кликване на линка...');
                    link.click();
                    
                    // Проверка дали линкът е активиран
                    setTimeout(() => {
                        console.log('[URL Manager] Проверка след кликване - link.href:', link.href);
                    }, 100);
                    
                    // Изчакваме малко преди да премахнем линка
                    setTimeout(() => {
                        if (document.body.contains(link)) {
                            document.body.removeChild(link);
                            console.log('[URL Manager] Линкът премахнат от DOM');
                        }
                    }, 500);
                    
                    console.log('[URL Manager] ✅ Линк активиран за отваряне в нов таб');
                };
            } else {
                // Нормален URL - отваряме в нов прозорец
                urlButton.innerHTML = `<strong>${escapeHtml(url.name)}</strong><br><small style="opacity: 0.8;">${escapeHtml(url.url)}</small>`;
                urlButton.onclick = () => {
                    window.open(url.url, '_blank');
                };
            }
            
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'btn btn-secondary';
            deleteButton.textContent = '🗑️';
            deleteButton.style.cssText = 'padding: 0.5rem; min-width: auto;';
            deleteButton.title = 'Изтрий';
            deleteButton.onclick = async () => {
                if (confirm(`Сигурни ли сте, че искате да изтриете "${url.name}"?`)) {
                    try {
                        await deleteURL(url.id);
                        await renderURLList(); // Презареждане на списъка
                    } catch (error) {
                        alert('Грешка при изтриване: ' + error.message);
                    }
                }
            };
            
            urlItem.appendChild(urlButton);
            urlItem.appendChild(deleteButton);
            urlList.appendChild(urlItem);
        });
    } catch (error) {
        console.error('[renderURLList] Грешка:', error);
        urlList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #d32f2f;">Грешка при зареждане на URL-ите. Моля, опитайте отново.</div>';
    }
}

/**
 * Екранира HTML символи за безопасност
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Мигрира стари URL-и от localStorage към базата данни (еднократно)
 */
async function migrateURLsFromLocalStorage() {
    try {
        const uik = getUIK();
        if (!uik) {
            return; // Няма UIK, няма какво да мигрираме
        }
        
        // Проверяваме дали вече сме мигрирали
        const migrationKey = `mamafood_urls_migrated_${uik}`;
        if (localStorage.getItem(migrationKey)) {
            return; // Вече сме мигрирали
        }
        
        // Зареждаме старите URL-и от localStorage
        const oldStorageKey = 'mamafood_urls';
        const stored = localStorage.getItem(oldStorageKey);
        if (!stored) {
            localStorage.setItem(migrationKey, 'true');
            return; // Няма стари данни
        }
        
        let oldURLs = [];
        try {
            oldURLs = JSON.parse(stored);
        } catch (e) {
            console.warn('[migrateURLs] Грешка при парсване на стари URL-и:', e);
            localStorage.setItem(migrationKey, 'true');
            return;
        }
        
        if (!Array.isArray(oldURLs) || oldURLs.length === 0) {
            localStorage.setItem(migrationKey, 'true');
            return; // Няма URL-и за миграция
        }
        
        console.log(`[migrateURLs] Намерени ${oldURLs.length} стари URL-и за миграция`);
        
        // Мигрираме всеки URL
        let migrated = 0;
        for (const oldURL of oldURLs) {
            try {
                await addURL(oldURL.name || 'Без име', oldURL.url || '');
                migrated++;
            } catch (error) {
                console.warn(`[migrateURLs] Грешка при миграция на URL "${oldURL.name}":`, error.message);
                // Продължаваме с останалите
            }
        }
        
        console.log(`[migrateURLs] Мигрирани ${migrated} от ${oldURLs.length} URL-и`);
        
        // Маркираме като мигрирано
        localStorage.setItem(migrationKey, 'true');
        
        // Изчистваме старите данни от localStorage (опционално)
        // localStorage.removeItem(oldStorageKey);
        
    } catch (error) {
        console.error('[migrateURLs] Грешка при миграция:', error);
    }
}

/**
 * Осигурява че "User Platform" URL съществува (добавя го ако липсва)
 * ПРЕМАХНАТО: MAMAFOOD вече не се добавя автоматично - потребителят може да го добави ръчно
 */
async function ensureUserPlatformURL() {
    // Празна функция - не добавяме автоматично "MAMAFOOD" URL
    // Потребителят може да добави MAMAFOOD ръчно чрез URL Manager формата
    console.log('[URL Manager] ensureUserPlatformURL() извикан, но автоматичното добавяне е премахнато');
    return;
}

/**
 * Показва URL Manager екрана
 */
async function showURLManager() {
    const urlManagerScreen = document.getElementById('uik-url-manager-screen');
    const successScreen = document.getElementById('uik-success-screen');
    
    if (urlManagerScreen) {
        urlManagerScreen.style.display = 'block';
        if (successScreen) successScreen.style.display = 'none';
        
        // ПРЕМАХНАТО: Не добавяме автоматично "MAMAFOOD" URL
        // await ensureUserPlatformURL();
        
        // Опитваме се да мигрираме стари URL-и (ако има такива)
        await migrateURLsFromLocalStorage();
        
        // Зареждаме и рендираме списъка
        await renderURLList();
        setupURLForm();
    }
}

/**
 * Скрива URL Manager екрана и показва success screen
 */
function hideURLManager() {
    const urlManagerScreen = document.getElementById('uik-url-manager-screen');
    const successScreen = document.getElementById('uik-success-screen');
    
    if (urlManagerScreen) {
        urlManagerScreen.style.display = 'none';
        if (successScreen) successScreen.style.display = 'block';
    }
}

/**
 * Настройва формата за добавяне на URL
 */
function setupURLForm() {
    const form = document.getElementById('url-add-form');
    const errorDiv = document.getElementById('url-manager-error');
    
    if (!form) return;
    
    // Премахване на стари event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
        
        const nameInput = document.getElementById('url-name');
        const urlInput = document.getElementById('url-address');
        const submitBtn = newForm.querySelector('button[type="submit"]');
        
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        
        if (!name || !url) {
            if (errorDiv) {
                errorDiv.textContent = 'Моля, попълнете всички полета.';
                errorDiv.style.display = 'block';
            }
            return;
        }
        
        // Валидация на URL формат
        // Разрешаваме специални URL-и като app://start за MAMAFOOD приложението
        const isSpecialURL = url === 'app://start' || url === 'app://user-platform' || url.startsWith('app://');
        
        if (!isSpecialURL) {
            try {
                new URL(url);
            } catch (e) {
                if (errorDiv) {
                    errorDiv.textContent = 'Моля, въведете валиден URL адрес (напр. https://billa.bg) или app://start за MAMAFOOD';
                    errorDiv.style.display = 'block';
                }
                return;
            }
        }
        
        // Деактивиране на бутона
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Добавяне...';
        }
        
        try {
            // Добавяне на URL
            await addURL(name, url);
            
            // Изчистване на формата
            nameInput.value = '';
            urlInput.value = '';
            
            // Рендиране на списъка
            await renderURLList();
            
            // Фокус върху първото поле
            nameInput.focus();
        } catch (error) {
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Грешка при добавяне на URL. Моля, опитайте отново.';
                errorDiv.style.display = 'block';
            }
        } finally {
            // Реактивиране на бутона
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '➕ Добави';
            }
        }
    });
}

// Експорт за глобална употреба
window.showURLManager = showURLManager;
window.hideURLManager = hideURLManager;
window.loadURLs = loadURLs;
window.addURL = addURL;
window.deleteURL = deleteURL;
window.renderURLList = renderURLList;
