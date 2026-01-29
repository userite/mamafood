// ============================================
// Accounting Chart Manager
// Управление на счетоводен сметкоплан с йерархична структура
// ============================================

// Автоматично определяне на API_BASE според hostname ПРЕДИ всичко друго
(function() {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname === 'pci.inex-project.net' || hostname === 'inex-project.net' || hostname.includes('inex-project.net')) {
        window.API_BASE_INIT = 'https://mamafood.onrender.com';
    } else {
        window.API_BASE_INIT = 'http://localhost:3000';
    }
})();

let API_BASE = (typeof window !== 'undefined' && window.API_BASE_INIT) ? window.API_BASE_INIT : 'http://localhost:3000';
let treeData = [];
let expandedNodes = new Set();

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Автоматично избиране на production URL ако сме на production домейн (същото като test-uik-api.html)
    const hostname = window.location.hostname;
    const apiBaseSelect = document.getElementById('api-base');
    const apiConfigDiv = document.getElementById('api-config');
    
    console.log('[Accounting Chart] Инициализация - Hostname:', hostname);
    console.log('[Accounting Chart] Инициализация - Origin:', window.location.origin);
    console.log('[Accounting Chart] Инициализация - Първоначален API_BASE:', API_BASE);
    
    // Определяне на правилния API URL ПРЕДИ всичко друго
    if (hostname === 'pci.inex-project.net' || hostname === 'inex-project.net' || hostname.includes('inex-project.net')) {
        // На production - използвай production API и скрий combobox-а
        API_BASE = 'https://mamafood.onrender.com';
        console.log('[Accounting Chart] Production домейн открит, използвам production API:', API_BASE);
        
        if (apiBaseSelect) {
            apiBaseSelect.value = API_BASE;
            console.log('[Accounting Chart] Select стойност зададена на:', apiBaseSelect.value);
        }
        if (apiConfigDiv) {
            apiConfigDiv.style.display = 'none'; // Скриване на combobox-а на production
        }
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // На localhost - използвай локален API и покажи combobox-а
        API_BASE = 'http://localhost:3000';
        console.log('[Accounting Chart] Локален домейн, използвам локален API:', API_BASE);
        
        if (apiBaseSelect) {
            apiBaseSelect.value = API_BASE;
        }
        if (apiConfigDiv) {
            apiConfigDiv.style.display = 'block'; // Показване на combobox-а на localhost
        }
    } else {
        // Други домейни - покажи combobox-а за избор и използвай стойността от select-а
        if (apiConfigDiv) {
            apiConfigDiv.style.display = 'block';
        }
        if (apiBaseSelect && apiBaseSelect.value) {
            API_BASE = apiBaseSelect.value;
        } else {
            API_BASE = 'https://mamafood.onrender.com'; // Fallback към production
        }
        console.log('[Accounting Chart] Друг домейн, използвам:', API_BASE);
    }
    
    // ФИНАЛНА ПРОВЕРКА - гарантираме че API_BASE е правилен ПРЕДИ loadTree()
    // Ако сме на production но API_BASE все още е localhost, принудително го смени
    const isProduction = hostname === 'pci.inex-project.net' || hostname === 'inex-project.net' || hostname.includes('inex-project.net');
    
    if (isProduction && (API_BASE === 'http://localhost:3000' || !API_BASE || API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1'))) {
        console.log('[Accounting Chart] ⚠️ КРИТИЧНО: API_BASE е localhost на production! Принудителна корекция!');
        console.log('[Accounting Chart] ⚠️ Стара стойност:', API_BASE);
        API_BASE = 'https://mamafood.onrender.com';
        console.log('[Accounting Chart] ✅ Нова стойност:', API_BASE);
        
        if (apiBaseSelect) {
            apiBaseSelect.value = API_BASE;
            console.log('[Accounting Chart] ✅ Select синхронизиран:', apiBaseSelect.value);
        }
    }
    
    // НЕ извикваме updateAPIBase() тук, защото вече сме задали правилната стойност
    // updateAPIBase() може да върне старата стойност от select-а
    
    // Финален assert - ако все още е localhost на production, нещо е много зле
    if (isProduction && API_BASE.includes('localhost')) {
        console.error('[Accounting Chart] ❌❌❌ КРИТИЧНА ГРЕШКА: API_BASE все още е localhost след всички проверки!');
        API_BASE = 'https://mamafood.onrender.com';
        if (apiBaseSelect) apiBaseSelect.value = API_BASE;
    }
    
    console.log('[Accounting Chart] ✅ ФИНАЛЕН API Base:', API_BASE);
    console.log('[Accounting Chart] ✅ Hostname:', hostname);
    console.log('[Accounting Chart] ✅ Is Production:', isProduction);
    console.log('[Accounting Chart] ✅ Select value:', apiBaseSelect ? apiBaseSelect.value : 'N/A');
    
    // Зареждане на дървото
    loadTree();
});

// Обновяване на API base URL
function updateAPIBase() {
    const select = document.getElementById('api-base');
    const hostname = window.location.hostname;
    
    if (select && select.value) {
        // Проверка: ако сме на production но select има localhost, принудително смени
        if ((hostname === 'pci.inex-project.net' || hostname === 'inex-project.net' || hostname.includes('inex-project.net')) 
            && select.value === 'http://localhost:3000') {
            console.log('[Accounting Chart] ⚠️ updateAPIBase: Select има localhost на production, принудително смяна!');
            select.value = 'https://mamafood.onrender.com';
            API_BASE = 'https://mamafood.onrender.com';
        } else {
            API_BASE = select.value;
        }
        console.log('[Accounting Chart] API Base (от select):', API_BASE);
    } else {
        // Fallback: автоматично определяне ако select не съществува
        if (hostname === 'pci.inex-project.net' || hostname === 'inex-project.net' || hostname.includes('inex-project.net')) {
            API_BASE = 'https://mamafood.onrender.com';
        } else {
            API_BASE = 'http://localhost:3000';
        }
        console.log('[Accounting Chart] API Base (auto-detected):', API_BASE);
    }
}

// Зареждане на дървото от API
async function loadTree() {
    const container = document.getElementById('tree-container');
    container.innerHTML = '<div class="loading">Зареждане...</div>';
    
    try {
        const url = `${API_BASE}/api/accounting-chart`;
        console.log('[Accounting Chart] Зареждане от:', url);
        console.log('[Accounting Chart] Текущ hostname:', window.location.hostname);
        console.log('[Accounting Chart] Текущ origin:', window.location.origin);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('[Accounting Chart] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Accounting Chart] Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }
        
        treeData = await response.json();
        console.log('[Accounting Chart] Заредени записи:', treeData.length);
        
        renderTree();
    } catch (error) {
        console.error('[Accounting Chart] Грешка при зареждане:', error);
        console.error('[Accounting Chart] Error details:', {
            message: error.message,
            stack: error.stack,
            API_BASE: API_BASE,
            hostname: window.location.hostname
        });
        
        let errorMessage = error.message;
        if (error.message === 'Failed to fetch') {
            errorMessage = `Не може да се свърже със сървъра на ${API_BASE}. Провери дали сървърът работи и дали URL-ът е правилен.`;
        }
        
        container.innerHTML = `<div class="message error">❌ Грешка при зареждане: ${errorMessage}</div>`;
        showMessage(`Грешка при зареждане на данните: ${errorMessage}`, 'error');
    }
}

// Изграждане на дървовидна структура
function buildTree(items) {
    const map = new Map();
    const roots = [];
    
    // Създаване на map за бърз достъп
    items.forEach(item => {
        map.set(item.uik_id, {
            ...item,
            children: []
        });
    });
    
    // Изграждане на дървото
    items.forEach(item => {
        const node = map.get(item.uik_id);
        // Нормализация: проверяваме за null, undefined, или празен string
        const parentId = item.uik_idfat === null || item.uik_idfat === undefined || item.uik_idfat === '' 
            ? null 
            : String(item.uik_idfat);
        
        if (!parentId) {
            roots.push(node);
        } else {
            const parent = map.get(parentId);
            if (parent) {
                parent.children.push(node);
                console.log(`[buildTree] Добавен child ${item.code} (${item.uik_id}) към parent ${parent.code} (${parentId})`);
            } else {
                // Parent не съществува - добавяме като root
                console.warn(`[buildTree] Parent ${parentId} не е намерен за ${item.code}, добавяне като root`);
                roots.push(node);
            }
        }
    });
    
    // Сортиране на децата по code
    function sortChildren(node) {
        node.children.sort((a, b) => a.code.localeCompare(b.code));
        node.children.forEach(child => sortChildren(child));
    }
    
    roots.forEach(root => sortChildren(root));
    roots.sort((a, b) => a.code.localeCompare(b.code));
    
    return roots;
}

// Рендиране на дървото
function renderTree() {
    const container = document.getElementById('tree-container');
    
    if (treeData.length === 0) {
        container.innerHTML = '<div class="empty-tree">Няма записи. Добавете първия запис с бутона "➕ Добави нов запис".</div>';
        return;
    }
    
    const tree = buildTree(treeData);
    container.innerHTML = '';
    
    tree.forEach(node => {
        renderNode(node, container, 0);
    });
}

// Рендиране на един node
function renderNode(node, container, level) {
    const nodeId = `node-${node.uik_id}`;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.uik_id);
    
    // Debug logging за записи с деца
    if (hasChildren) {
        console.log(`[renderNode] Запис ${node.code} (${node.uik_id}) има ${node.children.length} деца, разгънат: ${isExpanded}`);
    }
    
    const item = document.createElement('div');
    item.className = 'tree-item';
    item.id = nodeId;
    item.dataset.uikId = node.uik_id;
    
    let indent = '';
    for (let i = 0; i < level; i++) {
        indent += '<span class="tree-indent"></span>';
    }
    
    // Екраниране на UUID за безопасност
    const safeUikId = escapeHtml(node.uik_id);
    
    const toggleHtml = hasChildren 
        ? `<span class="tree-toggle" onclick="toggleNode('${safeUikId}')">${isExpanded ? '▼' : '▶'}</span>`
        : '<span class="tree-indent"></span>';
    
    item.innerHTML = `
        ${indent}
        ${toggleHtml}
        <div class="tree-content">
            <span class="tree-code">${escapeHtml(node.code)}</span>
            <span class="tree-name">${escapeHtml(node.name)}</span>
            <span class="tree-uik-id" onclick="copyUUID('${safeUikId}')" title="Кликни за копиране на UUID">UIK: ${safeUikId}</span>
            <div class="tree-actions">
                <button class="secondary" onclick="editItem('${safeUikId}')" title="Редактирай">✏️</button>
                <button class="danger" onclick="deleteItem('${safeUikId}')" title="Изтрий">🗑️</button>
                <button onclick="addChild('${safeUikId}')" title="Добави под-запис">➕</button>
            </div>
        </div>
    `;
    
    container.appendChild(item);
    
    // Рендиране на децата ако е разгънат
    if (hasChildren && isExpanded) {
        node.children.forEach(child => {
            renderNode(child, container, level + 1);
        });
    }
}

// Разгъване/сгъване на node
function toggleNode(uikId) {
    console.log(`[toggleNode] Кликнат node с UUID: ${uikId}`);
    console.log(`[toggleNode] Преди: expandedNodes има ${expandedNodes.size} елемента`);
    console.log(`[toggleNode] UUID в Set: ${expandedNodes.has(uikId)}`);
    
    if (expandedNodes.has(uikId)) {
        expandedNodes.delete(uikId);
        console.log(`[toggleNode] Сгъване на node ${uikId}`);
    } else {
        expandedNodes.add(uikId);
        console.log(`[toggleNode] Разгъване на node ${uikId}`);
    }
    
    console.log(`[toggleNode] След: expandedNodes има ${expandedNodes.size} елемента`);
    renderTree();
}

// Копиране на UUID в clipboard
async function copyUUID(uuid) {
    try {
        await navigator.clipboard.writeText(uuid);
        showMessage(`✅ UUID копиран: ${uuid}`, 'success');
    } catch (error) {
        // Fallback за стари браузъри
        const textArea = document.createElement('textarea');
        textArea.value = uuid;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showMessage(`✅ UUID копиран: ${uuid}`, 'success');
        } catch (err) {
            showMessage(`❌ Грешка при копиране. UUID: ${uuid}`, 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Разгъване на всички
function expandAll() {
    treeData.forEach(item => {
        expandedNodes.add(item.uik_id);
    });
    renderTree();
}

// Сгъване на всички
function collapseAll() {
    expandedNodes.clear();
    renderTree();
}

// Показване на форма за добавяне
function showAddForm(parentId = null) {
    const formContainer = document.getElementById('form-container');
    const formTitle = document.getElementById('form-title');
    const form = document.getElementById('accounting-form');
    const submitBtn = document.getElementById('submit-btn');
    
    formTitle.textContent = 'Добави нов запис';
    submitBtn.textContent = '💾 Запази';
    form.reset();
    document.getElementById('form-uik-id').value = '';
    
    // Попълване на parent dropdown
    populateParentDropdown(parentId);
    
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Показване на форма за редактиране
async function editItem(uikId) {
    try {
        const response = await fetch(`${API_BASE}/api/accounting-chart/${encodeURIComponent(uikId)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const item = await response.json();
        
        const formContainer = document.getElementById('form-container');
        const formTitle = document.getElementById('form-title');
        const form = document.getElementById('accounting-form');
        const submitBtn = document.getElementById('submit-btn');
        
        formTitle.textContent = 'Редактирай запис';
        submitBtn.textContent = '💾 Запази промените';
        
        document.getElementById('form-uik-id').value = item.uik_id;
        document.getElementById('form-code').value = item.code;
        document.getElementById('form-name').value = item.name;
        
        // Попълване на parent dropdown
        populateParentDropdown(item.uik_idfat, item.uik_id);
        
        formContainer.style.display = 'block';
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('[Accounting Chart] Грешка при зареждане на запис:', error);
        showMessage(`Грешка при зареждане на записа: ${error.message}`, 'error');
    }
}

// Добавяне на под-запис
function addChild(parentId) {
    showAddForm(parentId);
}

// Попълване на parent dropdown
function populateParentDropdown(selectedParentId = null, excludeId = null) {
    const select = document.getElementById('form-parent');
    select.innerHTML = '<option value="">-- Без parent (root ниво) --</option>';
    
    // Изграждане на опции от дървото
    function addOptions(nodes, prefix = '', level = 0) {
        nodes.forEach(node => {
            if (node.uik_id === excludeId) {
                return; // Пропускаме текущия запис
            }
            
            const option = document.createElement('option');
            option.value = node.uik_id;
            option.textContent = `${prefix}${node.code} - ${node.name}`;
            if (node.uik_id === selectedParentId) {
                option.selected = true;
            }
            select.appendChild(option);
            
            if (node.children && node.children.length > 0) {
                addOptions(node.children, prefix + '  ', level + 1);
            }
        });
    }
    
    const tree = buildTree(treeData);
    addOptions(tree);
}

// Скриване на формата
function hideForm() {
    document.getElementById('form-container').style.display = 'none';
    document.getElementById('accounting-form').reset();
}

// Обработка на submit на формата
async function handleSubmit(event) {
    event.preventDefault();
    
    const uikId = document.getElementById('form-uik-id').value;
    const code = document.getElementById('form-code').value.trim();
    const name = document.getElementById('form-name').value.trim();
    const parentId = document.getElementById('form-parent').value;
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Запазване...';
    
    try {
        let response;
        
        if (uikId) {
            // Редактиране
            response = await fetch(`${API_BASE}/api/accounting-chart/${encodeURIComponent(uikId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    name: name,
                    uik_idfat: parentId || null
                })
            });
        } else {
            // Добавяне
            response = await fetch(`${API_BASE}/api/accounting-chart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    name: name,
                    uik_idfat: parentId || null
                })
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        showMessage(
            uikId 
                ? `✅ Записът е обновен успешно!` 
                : `✅ Записът е добавен успешно!`,
            'success'
        );
        
        hideForm();
        await loadTree();
        
        // Разгъване на parent node ако има такъв
        if (result.uik_idfat) {
            expandedNodes.add(result.uik_idfat);
            renderTree();
        }
        
    } catch (error) {
        console.error('[Accounting Chart] Грешка при запазване:', error);
        showMessage(`❌ Грешка: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = uikId ? '💾 Запази промените' : '💾 Запази';
    }
}

// Изтриване на запис
async function deleteItem(uikId) {
    // Намиране на записа за показване на информация
    const item = treeData.find(i => i.uik_id === uikId);
    const itemInfo = item ? `${item.code} - ${item.name}` : `ID: ${uikId}`;
    
    if (!confirm(`Сигурни ли сте, че искате да изтриете записа:\n${itemInfo}\n\nВнимание: Не можете да изтриете запис с потомци!`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/accounting-chart/${encodeURIComponent(uikId)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        showMessage('✅ Записът е изтрит успешно!', 'success');
        await loadTree();
        
    } catch (error) {
        console.error('[Accounting Chart] Грешка при изтриване:', error);
        showMessage(`❌ Грешка: ${error.message}`, 'error');
    }
}

// Показване на съобщение
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Автоматично скриване след 5 секунди
    setTimeout(() => {
        messageDiv.className = 'message';
    }, 5000);
}

// Показване на raw данни от таблицата
async function showRawData() {
    const container = document.getElementById('raw-data-container');
    const dataDiv = document.getElementById('raw-data');
    
    container.style.display = 'block';
    dataDiv.textContent = 'Зареждане...';
    
    try {
        const response = await fetch(`${API_BASE}/api/accounting-chart`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Форматиране на JSON за показване
        dataDiv.textContent = JSON.stringify(data, null, 2);
        
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('[Accounting Chart] Грешка при зареждане на данни:', error);
        dataDiv.textContent = `Грешка: ${error.message}`;
    }
}

// Скриване на raw данни
function hideRawData() {
    document.getElementById('raw-data-container').style.display = 'none';
}

// Показване на диалог за импорт
function showImportDialog() {
    document.getElementById('import-container').style.display = 'block';
    document.getElementById('import-json').value = '';
    document.getElementById('import-result').innerHTML = '';
    document.getElementById('import-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Скриване на диалог за импорт
function hideImportDialog() {
    document.getElementById('import-container').style.display = 'none';
}

// Импорт на JSON данни
async function importJSON() {
    const jsonText = document.getElementById('import-json').value.trim();
    const resultDiv = document.getElementById('import-result');
    
    if (!jsonText) {
        resultDiv.innerHTML = '<div class="message error">Моля, въведете JSON данни!</div>';
        return;
    }
    
    try {
        // Парсване на JSON
        const data = JSON.parse(jsonText);
        
        if (!Array.isArray(data)) {
            throw new Error('JSON данните трябва да бъдат масив от обекти');
        }
        
        if (data.length === 0) {
            throw new Error('JSON масивът е празен');
        }
        
        resultDiv.innerHTML = '<div style="color: #666;">⏳ Импортиране на данни...</div>';
        
        // Потвърждение за изтриване
        if (!confirm(`Сигурни ли сте, че искате да импортирате ${data.length} записа?\n\nТова ще изтрие всички съществуващи записи!`)) {
            return;
        }
        
        // Изтриване на всички съществуващи записи
        try {
            const deleteResponse = await fetch(`${API_BASE}/api/accounting-chart/clear`, {
                method: 'DELETE'
            });
            
            if (!deleteResponse.ok) {
                const error = await deleteResponse.json();
                throw new Error(`Грешка при изтриване: ${error.error || deleteResponse.statusText}`);
            }
        } catch (error) {
            if (error.message.includes('404')) {
                // Таблицата е празна, продължаваме
                console.log('Таблицата е празна, продължаваме с импорта');
            } else {
                throw error;
            }
        }
        
        // Създаване на map за конвертиране на стари ID към нови UUID
        const idToUuidMap = new Map();
        const itemsWithParents = [];
        
        // Първо преминаване: създаване на записи без parent (root ниво)
        for (const item of data) {
            if (!item.code || !item.name) {
                console.warn('Пропускане на запис без code или name:', item);
                continue;
            }
            
            // Пропускаме записи с parent в първото преминаване
            if (item.idfat) {
                itemsWithParents.push(item);
                continue;
            }
            
            // Създаване на нов запис без parent
            const response = await fetch(`${API_BASE}/api/accounting-chart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: String(item.code).trim(),
                    name: String(item.name).trim(),
                    uik_idfat: null
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Грешка при създаване на запис ${item.code}: ${error.error || response.statusText}`);
            }
            
            const created = await response.json();
            idToUuidMap.set(item.id, created.uik_id);
        }
        
        // Второ преминаване: създаване на записи с parent (в правилния ред)
        let processed = 0;
        const maxIterations = itemsWithParents.length * 2; // Защита от безкраен цикъл
        let iteration = 0;
        
        while (itemsWithParents.length > 0 && iteration < maxIterations) {
            iteration++;
            const remaining = [];
            
            for (const item of itemsWithParents) {
                // Проверяваме дали parent вече е създаден
                if (item.idfat && idToUuidMap.has(item.idfat)) {
                    const parentUuid = idToUuidMap.get(item.idfat);
                    
                    // Създаване на запис с parent
                    const response = await fetch(`${API_BASE}/api/accounting-chart`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            code: String(item.code).trim(),
                            name: String(item.name).trim(),
                            uik_idfat: parentUuid
                        })
                    });
                    
                    if (response.ok) {
                        const created = await response.json();
                        idToUuidMap.set(item.id, created.uik_id);
                        processed++;
                    } else {
                        const error = await response.json();
                        console.warn(`Неуспешно създаване на ${item.code}:`, error.error);
                        remaining.push(item);
                    }
                } else {
                    // Parent още не е създаден, оставяме за следваща итерация
                    remaining.push(item);
                }
            }
            
            itemsWithParents.length = 0;
            itemsWithParents.push(...remaining);
        }
        
        if (itemsWithParents.length > 0) {
            console.warn(`Остават ${itemsWithParents.length} непроцесирани записа (вероятно липсват parent референции)`);
        }
        
        const totalImported = idToUuidMap.size;
        resultDiv.innerHTML = `<div class="message success">✅ Успешно импортирани ${totalImported} записа</div>`;
        
        // Презареждане на дървото
        setTimeout(async () => {
            await loadTree();
            hideImportDialog();
        }, 1500);
        
    } catch (error) {
        console.error('[Accounting Chart] Грешка при импорт:', error);
        resultDiv.innerHTML = `<div class="message error">❌ Грешка при импорт: ${error.message}</div>`;
    }
}

// Екраниране на HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
