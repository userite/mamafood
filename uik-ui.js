// ============================================
// UIK System - UI Management
// ============================================

// UIK Screen Management
let currentUIKScreen = null;

/**
 * Показва UIK контейнера и скрива основното приложение
 */
function showUIKContainer() {
    const uikContainer = document.getElementById('uik-container');
    const mainApp = document.getElementById('main-app-container');
    
    if (uikContainer) uikContainer.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
}

/**
 * Скрива UIK контейнера и показва основното приложение
 */
function hideUIKContainer() {
    const uikContainer = document.getElementById('uik-container');
    const mainApp = document.getElementById('main-app-container');
    
    if (uikContainer) uikContainer.style.display = 'none';
    if (mainApp) mainApp.style.display = 'flex';
}

/**
 * Показва конкретен UIK екран
 */
function showUIKScreen(screenId) {
    // Скриваме всички екрани
    const screens = ['uik-registration-screen', 'uik-login-screen', 'uik-success-screen', 'uik-url-manager-screen'];
    screens.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) screen.style.display = 'none';
    });
    
    // Показваме избрания екран
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
        currentUIKScreen = screenId;
    }
}

/**
 * Показва екран за регистрация
 */
function showUIKRegistration() {
    showUIKContainer();
    showUIKScreen('uik-registration-screen');
    setupRegistrationForm();
}

/**
 * Показва екран за вход
 */
function showUIKLogin() {
    showUIKContainer();
    showUIKScreen('uik-login-screen');
    setupLoginForm();
    
    // Фокус върху PIN полето
    const pinInput = document.getElementById('uik-login-pin');
    if (pinInput) {
        setTimeout(() => pinInput.focus(), 100);
    }
}

/**
 * Показва екран за успех
 * @param {string} name - Име на потребителя
 * @param {string} uik - УИК (Универсален Идентификационен Ключ)
 */
function showUIKSuccess(name, uik) {
    showUIKContainer();
    showUIKScreen('uik-success-screen');
    
    const nameElement = document.getElementById('uik-success-name');
    if (nameElement) {
        nameElement.textContent = name;
    }
    
    // Показване на UIK (Универсален Идентификационен Ключ)
    const uikElement = document.getElementById('uik-success-uik');
    if (uikElement) {
        // Ако UIK не е подаден, опитваме се да го вземем от localStorage
        const displayUIK = uik || getUIK() || 'Не е намерен';
        uikElement.textContent = displayUIK;
    }
}

/**
 * Настройва формата за регистрация
 */
function setupRegistrationForm() {
    const form = document.getElementById('uik-registration-form');
    const attachCheckbox = document.getElementById('uik-attach-mode');
    const attachKeywordGroup = document.getElementById('uik-attach-keyword-group');
    const errorDiv = document.getElementById('uik-registration-error');
    
    if (!form) return;
    
    // Toggle за attach mode
    const attachFields = document.getElementById('uik-attach-fields');
    const registrationFields = document.getElementById('uik-registration-fields');
    const attachPersonalIdInput = document.getElementById('uik-attach-personal-id');
    const attachPinInput = document.getElementById('uik-attach-pin');
    const nameInput = document.getElementById('uik-name');
    const personalIdInput = document.getElementById('uik-personal-id');
    const pinInput = document.getElementById('uik-pin');
    const pinConfirmInput = document.getElementById('uik-pin-confirm');
    
    if (attachCheckbox) {
        attachCheckbox.addEventListener('change', function() {
            const isAttachMode = this.checked;
            
            // Актуализиране на текста на бутона
            const submitBtn = form.querySelector('button[type="submit"]');
            
            if (isAttachMode) {
                // ATTACH режим - показваме само личен ID и PIN
                if (attachFields) attachFields.style.display = 'block';
                if (registrationFields) registrationFields.style.display = 'none';
                if (attachPersonalIdInput) attachPersonalIdInput.required = true;
                if (attachPinInput) attachPinInput.required = true;
                if (nameInput) nameInput.required = false;
                if (personalIdInput) personalIdInput.required = false;
                if (pinInput) pinInput.required = false;
                if (pinConfirmInput) pinConfirmInput.required = false;
                if (submitBtn) submitBtn.textContent = 'Прикачи';
                
                // Изчистване на полетата за нормална регистрация
                if (nameInput) nameInput.value = '';
                if (personalIdInput) personalIdInput.value = '';
                if (pinInput) pinInput.value = '';
                if (pinConfirmInput) pinConfirmInput.value = '';
            } else {
                // Нормална регистрация - показваме всички полета
                if (attachFields) attachFields.style.display = 'none';
                if (registrationFields) registrationFields.style.display = 'block';
                if (attachPersonalIdInput) attachPersonalIdInput.required = false;
                if (attachPinInput) attachPinInput.required = false;
                if (nameInput) nameInput.required = true;
                if (personalIdInput) personalIdInput.required = true; // Личният ID е задължителен за ATTACH функционалност
                if (pinInput) pinInput.required = true;
                if (pinConfirmInput) pinConfirmInput.required = true;
                if (submitBtn) submitBtn.textContent = 'Регистрирай';
                
                // Изчистване на полетата за ATTACH
                if (attachPersonalIdInput) attachPersonalIdInput.value = '';
                if (attachPinInput) attachPinInput.value = '';
            }
        });
    }
    
    // Submit handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[UIK Registration] Form submit triggered');
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
        
        // Валидация
        const attachMode = attachCheckbox ? attachCheckbox.checked : false;
        let pin = ''; // Дефинираме pin извън if блока
        let name = '';
        let personalId = '';
        let address = '';
        let phone = '';
        
        if (attachMode) {
            // ATTACH режим - валидираме само личен ID и PIN
            const attachPersonalId = document.getElementById('uik-attach-personal-id').value.trim();
            const attachPin = document.getElementById('uik-attach-pin').value;
            
            if (!attachPersonalId) {
                showError('uik-registration-error', 'Моля, въведете личен ID (ЕГН/БУЛСТАТ) от регистрацията.');
                return;
            }
            
            if (!attachPin || attachPin.length < 4) {
                showError('uik-registration-error', 'PIN кодът трябва да е поне 4 символа.');
                return;
            }
            } else {
                // Нормална регистрация - валидираме задължителните полета (име, личен ID и PIN)
                pin = document.getElementById('uik-pin').value;
                name = document.getElementById('uik-name').value.trim();
                personalId = document.getElementById('uik-personal-id').value.trim();
                address = document.getElementById('uik-address').value.trim();
                phone = document.getElementById('uik-phone').value.trim();
                const email = document.getElementById('uik-email').value.trim();
                const pinConfirm = document.getElementById('uik-pin-confirm').value;
                
                // Проверка на задължителните полета
                if (!name || name.length === 0) {
                    showError('uik-registration-error', 'Моля, въведете име.');
                    return;
                }
                
                if (!personalId || personalId.length === 0) {
                    showError('uik-registration-error', 'Моля, въведете личен ID (ЕГН/БУЛСТАТ).');
                    return;
                }
                
                if (!pin || pin.length === 0) {
                    showError('uik-registration-error', 'Моля, въведете PIN код.');
                    return;
                }
            
            // Проверка на PIN потвърждението
            if (pin !== pinConfirm) {
                showError('uik-registration-error', 'PIN кодовете не съвпадат.');
                return;
            }
            
            // Проверка на минимална дължина на PIN
            if (pin.length < 4) {
                showError('uik-registration-error', 'PIN кодът трябва да е поне 4 символа.');
                return;
            }
        }
        
        // Деактивиране на бутона за submit
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = attachMode ? 'Прикачване...' : 'Регистриране...';
        }
        
        try {
            if (attachMode) {
                // Прикачване към съществуващ акаунт
                const attachPersonalId = document.getElementById('uik-attach-personal-id').value.trim();
                const attachPin = document.getElementById('uik-attach-pin').value;
                const result = await attachToUIK(attachPersonalId, attachPin);
                if (result && result.uik) {
                    // Успешно прикачване
                    const info = await getUIKInfo(result.uik);
                    showUIKSuccess(info.name || 'Потребител', result.uik);
                }
            } else {
                // Нова регистрация
                const email = document.getElementById('uik-email').value.trim();
                
                // Конвертиране на празни стрингове в null
                const finalPersonalId = personalId && personalId.length > 0 ? personalId : null;
                const finalAddress = address && address.length > 0 ? address : null;
                const finalPhone = phone && phone.length > 0 ? phone : null;
                const finalEmail = email && email.length > 0 ? email : null;
                
                // Логиране за дебъг
                console.log('[UIK Registration] Данни за регистрация:', {
                    name,
                    personalId: finalPersonalId,
                    address: finalAddress,
                    phone: finalPhone,
                    email: finalEmail,
                    pinLength: pin ? pin.length : 0,
                    deviceSerial: getDeviceSerial()
                });
                
                const result = await registerUIK(name, finalPersonalId, finalAddress, finalPhone, finalEmail, pin, null);
                if (result && result.uik) {
                    // Успешна регистрация
                    console.log('[UIK Registration] Успешна регистрация:', result.uik);
                    showUIKSuccess(name, result.uik);
                }
            }
        } catch (error) {
            showError('uik-registration-error', error.message || 'Грешка при регистрация. Моля, опитайте отново.');
            
            // Реактивиране на бутона
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = attachMode ? 'Прикачи' : 'Регистрирай';
            }
        }
    });
}

/**
 * Настройва формата за вход
 */
function setupLoginForm() {
    const form = document.getElementById('uik-login-form');
    const errorDiv = document.getElementById('uik-login-error');
    const usePersonalIdCheckbox = document.getElementById('uik-login-use-personal-id');
    const personalIdGroup = document.getElementById('uik-login-personal-id-group');
    const personalIdInput = document.getElementById('uik-login-personal-id');
    
    if (!form) return;
    
    // Toggle за използване на personal_id
    if (usePersonalIdCheckbox && personalIdGroup) {
        usePersonalIdCheckbox.addEventListener('change', function() {
            if (this.checked) {
                personalIdGroup.style.display = 'block';
                if (personalIdInput) personalIdInput.required = true;
            } else {
                personalIdGroup.style.display = 'none';
                if (personalIdInput) {
                    personalIdInput.required = false;
                    personalIdInput.value = '';
                }
            }
        });
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
        
        const pin = document.getElementById('uik-login-pin').value;
        const usePersonalId = usePersonalIdCheckbox ? usePersonalIdCheckbox.checked : false;
        const personalId = usePersonalId && personalIdInput ? personalIdInput.value.trim() : null;
        const uik = getUIK();
        
        if (!pin) {
            showError('uik-login-error', 'Моля, въведете PIN код.');
            return;
        }
        
        // Ако използва personal_id, проверяваме дали е попълнен
        if (usePersonalId && !personalId) {
            showError('uik-login-error', 'Моля, въведете личен ID (ЕГН/БУЛСТАТ).');
            return;
        }
        
        // Ако не използва personal_id, проверяваме дали има UIK
        if (!usePersonalId && !uik) {
            showError('uik-login-error', 'Не е намерен UIK. Моля, регистрирайте се отново или използвайте личен ID.');
            return;
        }
        
        // Деактивиране на бутона за submit
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Проверка...';
        }
        
        try {
            let result;
            
            if (usePersonalId && personalId) {
                // Използваме ATTACH за да намерим UIK по personal_id + PIN
                console.log('[UIK Login] Опит за вход с personal_id:', personalId.substring(0, 10) + '...');
                result = await attachToUIK(personalId, pin);
                if (result && result.uik) {
                    // Успешно прикачване - получаваме UIK и показваме success
                    const info = await getUIKInfo(result.uik);
                    console.log('[UIK Login] Успешен вход чрез personal_id:', info.name);
                    showUIKSuccess(info.name || 'Потребител', result.uik);
                    return;
                }
            } else {
                // Нормален вход с UIK + PIN
                console.log('[UIK Login] Опит за вход с UIK:', uik ? uik.substring(0, 20) + '...' : 'null');
                try {
                    result = await verifyUIK(uik, pin);
                    if (result && result.success) {
                        // Успешна проверка
                        console.log('[UIK Login] Успешен вход:', result.name);
                        showUIKSuccess(result.name || 'Потребител', uik);
                        return;
                    }
                } catch (verifyError) {
                    // Ако verify не работи и има запазен personal_id, опитваме автоматично с него
                    if (verifyError.message && verifyError.message.includes('Не е намерена регистрация')) {
                        const savedPersonalId = typeof getPersonalId === 'function' ? getPersonalId() : null;
                        if (savedPersonalId) {
                            console.log('[UIK Login] UIK не е намерен, опитвам автоматично с personal_id:', savedPersonalId.substring(0, 10) + '...');
                            try {
                                const attachResult = await attachToUIK(savedPersonalId, pin);
                                if (attachResult && attachResult.uik) {
                                    // Успешно прикачване - получаваме UIK и показваме success
                                    const info = await getUIKInfo(attachResult.uik);
                                    console.log('[UIK Login] Успешен вход чрез автоматичен fallback с personal_id:', info.name);
                                    showUIKSuccess(info.name || 'Потребител', attachResult.uik);
                                    return;
                                }
                            } catch (attachError) {
                                // Ако и attach не работи, показваме оригиналната грешка
                                console.error('[UIK Login] Автоматичен fallback също не работи:', attachError);
                                throw verifyError; // Хвърляме оригиналната грешка
                            }
                        }
                    }
                    // Ако няма personal_id или fallback не работи, хвърляме грешката
                    throw verifyError;
                }
            }
        } catch (error) {
            console.error('[UIK Login] Грешка при вход:', error);
            
            let errorMessage = error.message || 'Невалиден PIN код. Моля, опитайте отново.';
            
            // По-специфични съобщения за различни типове грешки
            if (error.message && error.message.includes('Не е намерена регистрация')) {
                const uikFromStorage = getUIK();
                const savedPersonalId = typeof getPersonalId === 'function' ? getPersonalId() : null;
                
                errorMessage = 'Не е намерена регистрация с този UIK.\n\n' +
                              `UIK в localStorage: ${uikFromStorage ? uikFromStorage.substring(0, 20) + '...' : 'няма'}\n` +
                              `${savedPersonalId ? `Запазен personal_id: ${savedPersonalId.substring(0, 10) + '...'}\n` : ''}\n` +
                              'Възможни причини:\n' +
                              '• UIK в localStorage не съвпада с този в базата данни\n' +
                              '• Регистрацията е изтрита от базата данни\n' +
                              '• Проблем с базата данни\n\n' +
                              'Решение:\n' +
                              '1. Маркирай checkbox-а "Използвай личен ID вместо UIK" и въведи личен ID + PIN\n' +
                              '2. Натисни RESET за да изчистиш локалните данни и регистрирай се отново\n' +
                              '3. Използвай ATTACH за да се прикачиш към съществуващ акаунт\n\n' +
                              '💡 Ако знаеш личния си ID и PIN, може да използваш checkbox-а по-горе.';
                              
                // Показваме бутон за бързо прикачване
                const errorDiv = document.getElementById('uik-login-error');
                if (errorDiv) {
                    errorDiv.innerHTML = `
                        <div style="margin-bottom: 1rem;">
                            ${errorMessage.replace(/\n/g, '<br>')}
                        </div>
                        ${savedPersonalId ? `
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('uik-login-use-personal-id').checked = true; document.getElementById('uik-login-use-personal-id').dispatchEvent(new Event('change')); document.getElementById('uik-login-personal-id').value = '${savedPersonalId}';" style="width: 100%; margin-top: 0.5rem;">
                            🔄 Използвай запазения личен ID
                        </button>
                        ` : ''}
                        <button type="button" class="btn btn-secondary" onclick="showUIKRegistration(); document.getElementById('uik-attach-mode').checked = true; document.getElementById('uik-attach-mode').dispatchEvent(new Event('change'));" style="width: 100%; margin-top: 0.5rem;">
                            🔗 Използвай ATTACH за прикачване
                        </button>
                    `;
                } else {
                    showError('uik-login-error', errorMessage);
                }
                return; // Не показваме стандартното съобщение
            } else if (error.message && error.message.includes('Устройството не е регистрирано')) {
                errorMessage = 'Устройството не е регистрирано за този UIK.\n\n' +
                              'Възможни причини:\n' +
                              '• Устройството не е прикачено към този акаунт\n' +
                              '• Device serial е променен\n\n' +
                              'Решение: Използвайте ATTACH за да прикачите устройството към акаунта.';
            }
            
            showError('uik-login-error', errorMessage);
            
            // Реактивиране на бутона
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Вход';
            }
            
            // Изчистване на PIN полето
            const pinInput = document.getElementById('uik-login-pin');
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
        }
    });
}

/**
 * Показва съобщение за грешка
 */
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

/**
 * Стартира основното приложение
 */
function startApp() {
    hideUIKContainer();
    
    // Стартиране на основното приложение
    // Проверяваме дали initApp е вече извикана (за да не я извикваме два пъти)
    if (typeof initApp === 'function' && !window.appInitialized) {
        window.appInitialized = true;
        initApp();
    } else if (!window.appInitialized) {
        // Ако initApp не е дефинирана, просто показваме основното приложение
        console.log('Starting main application...');
        window.appInitialized = true;
    }
}

/**
 * Показва диалог за RESET
 * Изтрива само локалните данни и рестартира приложението от регистрация/attach
 * НЕ пипа базата данни
 */
async function showUIKReset() {
    const message = 'Сигурни ли сте, че искате да изтриете локалните UIK данни?\n\n' +
                   'Това ще:\n' +
                   '- Изтрие локалните UIK данни\n' +
                   '- Изчисти серийния номер на устройството\n' +
                   '- Изисква нова регистрация или attach към съществуващ акаунт\n\n' +
                   'Забележка: Данните в базата данни НЕ ще бъдат засегнати.';
    
    if (confirm(message)) {
        // Изчистване само на локалните данни (НЕ пипаме базата данни)
        clearUIK();
        console.log('[RESET] Локалните UIK данни са изтрити. Приложението ще рестартира от регистрация.');
        
        // Показваме екрана за регистрация (може да се избере регистрация или attach)
        showUIKRegistration();
    }
}

/**
 * Инициализация на UIK системата при зареждане
 */
function initUIKSystem() {
    // Проверка дали има запазен UIK
    if (hasUIK()) {
        // Показваме екран за вход
        showUIKLogin();
    } else {
        // Показваме екран за регистрация
        showUIKRegistration();
    }
}

// Експорт на функциите за глобална употреба
window.showUIKRegistration = showUIKRegistration;
window.showUIKLogin = showUIKLogin;
window.showUIKSuccess = showUIKSuccess;
window.startApp = startApp;
window.showUIKReset = showUIKReset;
window.initUIKSystem = initUIKSystem;
