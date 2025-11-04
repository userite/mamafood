// Функция за опресняване на данните
function refreshData() {
    // Показваме съобщение, че данните се опресняват
    showToast("Опресняване на данните...");
    
    // Презареждаме всички данни
    loadRecords();
    
    // Ако имаме функции за зареждане на други данни, ги извикваме тук
    if (typeof loadFeedingRecords === 'function') {
        loadFeedingRecords();
    }
    
    if (typeof loadReminders === 'function') {
        loadReminders();
    }
    
    if (typeof updateCharts === 'function') {
        updateCharts();
    }
    
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

