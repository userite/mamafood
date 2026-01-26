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
            urlButton.innerHTML = `<strong>${escapeHtml(url.name)}</strong><br><small style="opacity: 0.8;">${escapeHtml(url.url)}</small>`;
            urlButton.onclick = () => {
                window.open(url.url, '_blank');
            };
            
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
 * Показва URL Manager екрана
 */
async function showURLManager() {
    const urlManagerScreen = document.getElementById('uik-url-manager-screen');
    const successScreen = document.getElementById('uik-success-screen');
    
    if (urlManagerScreen) {
        urlManagerScreen.style.display = 'block';
        if (successScreen) successScreen.style.display = 'none';
        
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
        try {
            new URL(url);
        } catch (e) {
            if (errorDiv) {
                errorDiv.textContent = 'Моля, въведете валиден URL адрес (напр. https://billa.bg)';
                errorDiv.style.display = 'block';
            }
            return;
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
