// ============================================
// UIK System - Utility Functions
// ============================================
// UIK = Универсален Идентификационен Ключ
// Това е уникален UUID идентификатор, който се генерира при регистрация
// и служи за идентификация на потребителя и неговите устройства
// ============================================

const UIK_STORAGE_KEY = 'mamafood_uik';
const UIK_PIN_STORAGE_KEY = 'mamafood_uik_pin_hash'; // За локална проверка на PIN
const UIK_PERSONAL_ID_STORAGE_KEY = 'mamafood_uik_personal_id'; // За запазване на personal_id

// API Base URL - използва глобалния API_BASE ако е дефиниран, иначе определя автоматично
// Това се изпълнява lazy, когато е необходимо, за да избегнем проблеми с инициализацията
function getUIKAPIBase() {
    // Първо проверяваме дали API_BASE е вече дефинирана (от app_v2.js)
    if (typeof window !== 'undefined' && typeof window.API_BASE !== 'undefined') {
        return window.API_BASE;
    }
    // Проверяваме дали е дефинирана глобално (но не чрез window)
    try {
        if (typeof API_BASE !== 'undefined') {
            return API_BASE;
        }
    } catch (e) {
        // API_BASE не е достъпна, продължаваме с fallback
    }
    
    // Fallback логика - същата като в app_v2.js
    if (!window.location.hostname || window.location.protocol === 'file:') {
        return 'http://localhost:3000';
    }
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
        return 'http://localhost:3000';
    }
    if (hostname === 'inex-project.net' || hostname === 'pci.inex-project.net' || hostname.endsWith('.inex-project.net')) {
        return 'https://mamafood.onrender.com';
    }
    return 'https://mamafood.onrender.com';
}

// ============================================
// Device Serial Number
// ============================================

/**
 * Извлича уникален сериен номер на устройството
 * Използва различни техники в зависимост от наличността
 */
function getDeviceSerial() {
    // Първо опитваме да използваме localStorage за запазен device ID
    let deviceSerial = localStorage.getItem('mamafood_device_serial');
    
    if (deviceSerial) {
        console.log('[getDeviceSerial] Използване на съществуващ device_serial:', deviceSerial.substring(0, 20) + '...');
        return deviceSerial;
    }
    
    // Генериране на уникален device ID базиран на различни фактори
    let deviceId = '';
    
    // Опит за използване на различни browser APIs за уникална идентификация
    try {
        // Използваме комбинация от различни фактори
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        // Хеширане на fingerprint за по-кратък ID
        deviceId = hashString(fingerprint);
        console.log('[getDeviceSerial] Генериран нов device_serial от fingerprint');
    } catch (e) {
        // Fallback: използваме timestamp + random
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        console.log('[getDeviceSerial] Генериран нов device_serial от fallback');
    }
    
    // Запазване в localStorage
    localStorage.setItem('mamafood_device_serial', deviceId);
    console.log('[getDeviceSerial] Запазен device_serial в localStorage:', deviceId.substring(0, 20) + '...');
    
    return deviceId;
}

/**
 * Хеширане на string (за device fingerprint)
 */
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36) + '_' + str.length.toString(36);
}

// ============================================
// UIK Storage
// ============================================
// UIK (Универсален Идентификационен Ключ) се запазва локално
// за да може устройството да се идентифицира при следващи стартирания

/**
 * Запазва UIK (Универсален Идентификационен Ключ) в локален storage
 * @param {string} uik - UUID стойност на UIK
 */
function saveUIK(uik) {
    localStorage.setItem(UIK_STORAGE_KEY, uik);
}

/**
 * Чете UIK (Универсален Идентификационен Ключ) от локален storage
 * @returns {string|null} UIK стойност или null ако не съществува
 */
function getUIK() {
    return localStorage.getItem(UIK_STORAGE_KEY);
}

/**
 * Изтрива UIK (Универсален Идентификационен Ключ) от локален storage (за RESET)
 * Изчиства и device_serial за да може устройството да се регистрира отново
 */
function clearUIK() {
    localStorage.removeItem(UIK_STORAGE_KEY);
    localStorage.removeItem(UIK_PIN_STORAGE_KEY);
    localStorage.removeItem(UIK_PERSONAL_ID_STORAGE_KEY);
    // Изчистване на device_serial за да може устройството да се регистрира отново
    localStorage.removeItem('mamafood_device_serial');
}

/**
 * Чете personal_id от локален storage
 * @returns {string|null} personal_id стойност или null ако не съществува
 */
function getPersonalId() {
    return localStorage.getItem(UIK_PERSONAL_ID_STORAGE_KEY);
}

/**
 * Проверява дали има запазен UIK (Универсален Идентификационен Ключ)
 * @returns {boolean} true ако има запазен UIK, false иначе
 */
function hasUIK() {
    return !!getUIK();
}

// ============================================
// PIN Storage (за локална проверка)
// ============================================

/**
 * Запазва хеш на PIN за локална проверка
 * ВАЖНО: Това е само за локална проверка, не е основният механизъм за сигурност
 */
function savePINHash(pinHash) {
    localStorage.setItem(UIK_PIN_STORAGE_KEY, pinHash);
}

/**
 * Чете хеш на PIN от локален storage
 */
function getPINHash() {
    return localStorage.getItem(UIK_PIN_STORAGE_KEY);
}

// ============================================
// API Calls
// ============================================

/**
 * Регистрация на нов UIK (Универсален Идентификационен Ключ) акаунт
 * Генерира уникален UUID като UIK и го запазва в базата данни
 * @param {string} name - Име на потребителя
 * @param {string} personalId - Личен ID (ЕГН/БУЛСТАТ)
 * @param {string} address - Адрес (опционално)
 * @param {string} phone - Телефон (опционално)
 * @param {string} email - E-mail (опционално)
 * @param {string} pin - PIN код за достъп
 * @param {string} attachKeyword - Ключова дума за прикачване (опционално)
 * @returns {Promise<Object>} Обект с UIK и success статус
 */
async function registerUIK(name, personalId, address, phone, email, pin, attachKeyword) {
    try {
        // Вземане на device serial преди регистрацията
        const deviceSerial = getDeviceSerial();
        
        const requestBody = {
            name: name,
            personal_id: personalId,
            address: address,
            phone: phone,
            email: email,
            pin: pin,
            attach_keyword: attachKeyword || null,
            device_serial: deviceSerial // Изпращаме device_serial при регистрация
        };
        
        console.log('[registerUIK] Изпращане на заявка към:', `${getUIKAPIBase()}/api/uik/register`);
        console.log('[registerUIK] Request body:', { ...requestBody, pin: '***' }); // Не показваме PIN в логовете
        
        const response = await fetch(`${getUIKAPIBase()}/api/uik/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('[registerUIK] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Неуспешен отговор от сървъра' }));
            console.error('[registerUIK] Грешка от сървъра:', error);
            throw new Error(error.error || 'Грешка при регистрация');
        }
        
        const data = await response.json();
        console.log('[registerUIK] Успешен отговор:', data);
        
        // Запазване на UIK
        if (data.uik) {
            saveUIK(data.uik);
        }
        
        return data;
    } catch (error) {
        console.error('[registerUIK] Грешка при регистрация:', error);
        throw error;
    }
}

/**
 * Прикачване към съществуващ UIK (Универсален Идентификационен Ключ) акаунт
 * Позволява на ново устройство да се прикачи към вече съществуващ акаунт
 * Използва личен ID (ЕГН/БУЛСТАТ) за идентификация
 * @param {string} personalId - Личен ID (ЕГН/БУЛСТАТ) от регистрацията
 * @param {string} pin - PIN код за достъп
 * @returns {Promise<Object>} Обект с UIK и success статус
 */
async function attachToUIK(personalId, pin) {
    try {
        const deviceSerial = getDeviceSerial();
        
        const response = await fetch(`${getUIKAPIBase()}/api/uik/attach`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personal_id: personalId,
                device_serial: deviceSerial,
                pin: pin
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Грешка при прикачване');
        }
        
        const data = await response.json();
        
        // Запазване на UIK и personal_id
        if (data.uik) {
            saveUIK(data.uik);
        }
        // Запазваме personal_id за бъдеща употреба
        if (personalId) {
            localStorage.setItem(UIK_PERSONAL_ID_STORAGE_KEY, personalId);
            console.log('[attachToUIK] Personal_id запазен в localStorage');
        }
        
        return data;
    } catch (error) {
        console.error('Error attaching to UIK:', error);
        throw error;
    }
}

/**
 * Проверка на UIK (Универсален Идентификационен Ключ) + device_serial + PIN
 * Валидира че устройството е регистрирано за този UIK и PIN е правилен
 * @param {string} uik - UIK (Универсален Идентификационен Ключ)
 * @param {string} pin - PIN код за достъп
 * @returns {Promise<Object>} Обект с success статус и име на потребителя
 */
async function verifyUIK(uik, pin) {
    try {
        // Trim на UIK за да премахнем whitespace
        const trimmedUIK = uik ? uik.trim() : null;
        
        if (!trimmedUIK) {
            console.error('[verifyUIK] UIK е празен или null');
            throw new Error('UIK не е намерен. Моля, регистрирайте се отново.');
        }
        
        const deviceSerial = getDeviceSerial();
        
        console.log('[verifyUIK] Изпращане на заявка:', {
            uik: trimmedUIK.substring(0, 20) + '...',
            uikLength: trimmedUIK.length,
            deviceSerial: deviceSerial ? deviceSerial.substring(0, 20) + '...' : null,
            hasPin: !!pin
        });
        
        const response = await fetch(`${getUIKAPIBase()}/api/uik/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uik: trimmedUIK,
                device_serial: deviceSerial,
                pin: pin
            })
        });
        
        console.log('[verifyUIK] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Неуспешен отговор от сървъра' }));
            console.error('[verifyUIK] Грешка от сървъра:', error);
            throw new Error(error.error || 'Грешка при проверка');
        }
        
        const data = await response.json();
        console.log('[verifyUIK] Успешен отговор:', data);
        return data;
    } catch (error) {
        console.error('[verifyUIK] Грешка при проверка:', error);
        throw error;
    }
}

// Функцията registerDevice вече не е необходима, защото устройството се регистрира
// автоматично при регистрацията чрез /api/uik/register endpoint-а

/**
 * Взимане на информация за UIK регистрацията
 */
async function getUIKInfo(uik) {
    try {
        const response = await fetch(`${getUIKAPIBase()}/api/uik/info/${uik}`);
        
        if (!response.ok) {
            throw new Error('Грешка при зареждане на информация');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching UIK info:', error);
        throw error;
    }
}

/**
 * Изтриване на UIK регистрация от базата данни (за RESET)
 * @param {string} uik - UIK (Универсален Идентификационен Ключ)
 * @returns {Promise<Object>} Обект с success статус
 */
async function deleteUIKFromServer(uik) {
    try {
        const response = await fetch(`${getUIKAPIBase()}/api/uik/${uik}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Грешка при изтриване на регистрация');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting UIK from server:', error);
        throw error;
    }
}

// ============================================
// Export functions
// ============================================

// Експорт за глобална употреба (за uik-ui.js)
window.getDeviceSerial = getDeviceSerial;
window.saveUIK = saveUIK;
window.getUIK = getUIK;
window.clearUIK = clearUIK;
window.hasUIK = hasUIK;
window.getPersonalId = getPersonalId;
window.registerUIK = registerUIK;
window.attachToUIK = attachToUIK;
window.verifyUIK = verifyUIK;
window.getUIKInfo = getUIKInfo;
window.deleteUIKFromServer = deleteUIKFromServer;

// Експорт за Node.js модули (ако е необходимо)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getDeviceSerial,
        saveUIK,
        getUIK,
        clearUIK,
        hasUIK,
        registerUIK,
        attachToUIK,
        verifyUIK,
        getUIKInfo
    };
}
