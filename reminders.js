// Функционалност за напомняния за хранене
let reminders = [];
const REMINDERS_STORAGE_KEY = 'mamafood_reminders';

// Инициализиране на напомнянията
function initReminders() {
    loadReminders();
    setupReminderNotifications();
    renderRemindersUI();
}

// Зареждане на напомнянията от localStorage
function loadReminders() {
    const savedReminders = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (savedReminders) {
        reminders = JSON.parse(savedReminders);
    }
}

// Запазване на напомнянията в localStorage
function saveReminders() {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
}

// Добавяне на ново напомняне
function addReminder(time, title, message) {
    const id = Date.now().toString();
    const reminder = {
        id,
        time,
        title,
        message,
        enabled: true
    };
    
    reminders.push(reminder);
    saveReminders();
    setupReminderNotifications();
    renderRemindersUI();
}

// Изтриване на напомняне
function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    saveReminders();
    renderRemindersUI();
}

// Превключване на активирането на напомняне
function toggleReminder(id) {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
        reminder.enabled = !reminder.enabled;
        saveReminders();
        setupReminderNotifications();
        renderRemindersUI();
    }
}

// Настройка на нотификациите за напомняния
function setupReminderNotifications() {
    // Изчистване на всички съществуващи таймери
    reminders.forEach(reminder => {
        if (reminder.timerId) {
            clearTimeout(reminder.timerId);
            delete reminder.timerId;
        }
    });
    
    // Настройка на нови таймери за активните напомняния
    reminders.forEach(reminder => {
        if (!reminder.enabled) return;
        
        const [hours, minutes] = reminder.time.split(':').map(Number);
        
        const scheduleNextReminder = () => {
            const now = new Date();
            const reminderTime = new Date();
            reminderTime.setHours(hours, minutes, 0, 0);
            
            // Ако времето вече е минало днес, планирай за утре
            if (reminderTime <= now) {
                reminderTime.setDate(reminderTime.getDate() + 1);
            }
            
            const timeUntilReminder = reminderTime - now;
            
            reminder.timerId = setTimeout(() => {
                showNotification(reminder.title, reminder.message);
                // Планирай следващото напомняне за утре
                scheduleNextReminder();
            }, timeUntilReminder);
        };
        
        scheduleNextReminder();
    });
}

// Показване на нотификация
function showNotification(title, message) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message });
                }
            });
        }
    }
}

// Рендериране на UI за напомнянията
function renderRemindersUI() {
    const container = document.getElementById('reminders-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (reminders.length === 0) {
        container.innerHTML = '<p>Няма зададени напомняния</p>';
        return;
    }
    
    const remindersList = document.createElement('div');
    remindersList.className = 'reminders-list';
    
    reminders.forEach(reminder => {
        const reminderItem = document.createElement('div');
        reminderItem.className = `reminder-item ${reminder.enabled ? 'active' : 'inactive'}`;
        
        reminderItem.innerHTML = `
            <div class="reminder-time">${reminder.time}</div>
            <div class="reminder-details">
                <div class="reminder-title">${reminder.title}</div>
                <div class="reminder-message">${reminder.message}</div>
            </div>
            <div class="reminder-actions">
                <button class="toggle-reminder" data-id="${reminder.id}">
                    ${reminder.enabled ? 'Изключи' : 'Включи'}
                </button>
                <button class="delete-reminder" data-id="${reminder.id}">Изтрий</button>
            </div>
        `;
        
        remindersList.appendChild(reminderItem);
    });
    
    container.appendChild(remindersList);
    
    // Добавяне на слушатели за събития
    document.querySelectorAll('.toggle-reminder').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            toggleReminder(id);
        });
    });
    
    document.querySelectorAll('.delete-reminder').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            deleteReminder(id);
        });
    });
}

// Обработка на формата за добавяне на напомняне
function handleReminderForm() {
    const form = document.getElementById('reminder-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const time = document.getElementById('reminder-time').value;
        const title = document.getElementById('reminder-title').value;
        const message = document.getElementById('reminder-message').value;
        
        if (!time || !title) return;
        
        addReminder(time, title, message);
        form.reset();
    });
}

// Инициализиране при зареждане на страницата
document.addEventListener('DOMContentLoaded', () => {
    // Искане на разрешение за нотификации
    if ('Notification' in window) {
        Notification.requestPermission();
    }
    
    initReminders();
    handleReminderForm();
});