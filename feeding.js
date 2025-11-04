// Feeding functionality for МАМАФООД
document.addEventListener('DOMContentLoaded', function() {
    // Initialize feeding functionality
    initFeedingModule();
});

// Global variables for feeding module
let feedingRecords = [];
const FEEDING_STORAGE_KEY = 'mamafood_feeding_records';

function initFeedingModule() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnAdd = document.getElementById('btnAdd');
    const btnAddFeeding = document.getElementById('btnAddFeeding');

    // Add event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });

            // Show/hide appropriate add button
            if (tabId === 'milk-section') {
                btnAdd.style.display = 'inline-flex';
                btnAddFeeding.style.display = 'none';
            } else {
                btnAdd.style.display = 'none';
                btnAddFeeding.style.display = 'inline-flex';
            }
        });
    });

    // Feeding modal elements
    const feedingModal = document.getElementById('feedingModal');
    const feedingModalClose = document.getElementById('feedingModalClose');
    const btnCancelFeeding = document.getElementById('btnCancelFeeding');
    const feedingForm = document.getElementById('feedingForm');
    const feedingType = document.getElementById('feedingType');
    const breastSideGroup = document.getElementById('breastSideGroup');
    const amountGroup = document.getElementById('amountGroup');
    const foodTypeGroup = document.getElementById('foodTypeGroup');

    // Add event listener to feeding type select
    feedingType.addEventListener('change', () => {
        const selectedType = feedingType.value;
        
        // Show/hide appropriate form fields based on feeding type
        if (selectedType === 'breast') {
            breastSideGroup.style.display = 'block';
            amountGroup.style.display = 'none';
            foodTypeGroup.style.display = 'none';
        } else if (selectedType === 'bottle') {
            breastSideGroup.style.display = 'none';
            amountGroup.style.display = 'block';
            foodTypeGroup.style.display = 'none';
        } else if (selectedType === 'solid') {
            breastSideGroup.style.display = 'none';
            amountGroup.style.display = 'none';
            foodTypeGroup.style.display = 'block';
        }
    });

    // Add event listener to add feeding button
    btnAddFeeding.addEventListener('click', () => {
        openFeedingModal();
    });

    // Add event listeners to close feeding modal
    feedingModalClose.addEventListener('click', closeFeedingModal);
    btnCancelFeeding.addEventListener('click', closeFeedingModal);

    // Add event listener to feeding form submission
    feedingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveFeedingRecord();
    });

    // Load feeding records from local storage
    loadFeedingRecords();
    renderFeedingRecords();
    updateFeedingStats();
}

function openFeedingModal(feedingId = null) {
    const feedingModal = document.getElementById('feedingModal');
    const feedingModalTitle = document.getElementById('feedingModalTitle');
    const feedingForm = document.getElementById('feedingForm');
    const feedingStartTime = document.getElementById('feedingStartTime');
    
    // Reset form
    feedingForm.reset();
    
    // Set current date and time for new records
    if (!feedingId) {
        const now = new Date();
        const formattedDateTime = now.toISOString().slice(0, 16);
        feedingStartTime.value = formattedDateTime;
        feedingModalTitle.textContent = 'Добавяне на ново хранене';
        document.getElementById('feedingId').value = '';
    } else {
        // Find existing record and populate form
        const record = feedingRecords.find(r => r.id === feedingId);
        if (record) {
            document.getElementById('feedingType').value = record.type;
            
            // Show/hide appropriate fields based on feeding type
            const event = new Event('change');
            document.getElementById('feedingType').dispatchEvent(event);
            
            if (record.type === 'breast') {
                document.getElementById('breastSide').value = record.breastSide;
            } else if (record.type === 'bottle') {
                document.getElementById('feedingAmount').value = record.amount;
            } else if (record.type === 'solid') {
                document.getElementById('foodType').value = record.foodType;
            }
            
            document.getElementById('feedingStartTime').value = record.startTime.slice(0, 16);
            document.getElementById('feedingDuration').value = record.duration;
            document.getElementById('feedingNotes').value = record.notes || '';
            document.getElementById('feedingId').value = record.id;
            feedingModalTitle.textContent = 'Редактиране на хранене';
        }
    }
    
    // Show modal
    feedingModal.style.display = 'flex';
}

function closeFeedingModal() {
    const feedingModal = document.getElementById('feedingModal');
    feedingModal.style.display = 'none';
}

function saveFeedingRecord() {
    const feedingId = document.getElementById('feedingId').value;
    const feedingType = document.getElementById('feedingType').value;
    const feedingStartTime = document.getElementById('feedingStartTime').value;
    const feedingDuration = document.getElementById('feedingDuration').value;
    const feedingNotes = document.getElementById('feedingNotes').value;
    
    // Create new record object
    const newRecord = {
        id: feedingId || generateId(),
        type: feedingType,
        startTime: feedingStartTime,
        duration: parseInt(feedingDuration),
        notes: feedingNotes,
        timestamp: new Date().toISOString()
    };
    
    // Add type-specific data
    if (feedingType === 'breast') {
        newRecord.breastSide = document.getElementById('breastSide').value;
    } else if (feedingType === 'bottle') {
        newRecord.amount = document.getElementById('feedingAmount').value;
    } else if (feedingType === 'solid') {
        newRecord.foodType = document.getElementById('foodType').value;
    }
    
    // Update or add record
    if (feedingId) {
        const index = feedingRecords.findIndex(r => r.id === feedingId);
        if (index !== -1) {
            feedingRecords[index] = newRecord;
        }
    } else {
        feedingRecords.push(newRecord);
    }
    
    // Save to local storage
    saveFeedingRecordsToStorage();
    
    // Update UI
    renderFeedingRecords();
    updateFeedingStats();
    
    // Close modal
    closeFeedingModal();
}

function loadFeedingRecords() {
    const storedRecords = localStorage.getItem(FEEDING_STORAGE_KEY);
    if (storedRecords) {
        feedingRecords = JSON.parse(storedRecords);
    }
}

function saveFeedingRecordsToStorage() {
    localStorage.setItem(FEEDING_STORAGE_KEY, JSON.stringify(feedingRecords));
}

function renderFeedingRecords() {
    const feedingRecordsList = document.getElementById('feedingRecordsList');
    const feedingEmptyState = document.getElementById('feedingEmptyState');
    
    // Clear current list
    feedingRecordsList.innerHTML = '';
    
    // Sort records by start time (newest first)
    const sortedRecords = [...feedingRecords].sort((a, b) => 
        new Date(b.startTime) - new Date(a.startTime)
    );
    
    // Show/hide empty state message
    if (sortedRecords.length === 0) {
        feedingEmptyState.style.display = 'block';
    } else {
        feedingEmptyState.style.display = 'none';
        
        // Create record cards
        sortedRecords.forEach(record => {
            const recordCard = createFeedingRecordCard(record);
            feedingRecordsList.appendChild(recordCard);
        });
    }
}

function createFeedingRecordCard(record) {
    const card = document.createElement('div');
    card.className = 'record-card';
    card.setAttribute('data-id', record.id);
    
    // Format date and time
    const startTime = new Date(record.startTime);
    const formattedDate = startTime.toLocaleDateString();
    const formattedTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Determine icon based on feeding type
    let icon = '🍼';
    let typeText = 'Бутилка';
    
    if (record.type === 'breast') {
        icon = '👩‍🍼';
        typeText = 'Кърмене';
        if (record.breastSide === 'left') {
            typeText += ' (лява)';
        } else if (record.breastSide === 'right') {
            typeText += ' (дясна)';
        } else {
            typeText += ' (двете)';
        }
    } else if (record.type === 'solid') {
        icon = '🥣';
        typeText = `Твърда храна (${record.foodType || 'неуточнена'})`;
    } else if (record.type === 'bottle') {
        typeText += ` (${record.amount || 0} ml)`;
    }
    
    // Create card content
    card.innerHTML = `
        <div class="record-header">
            <span class="record-icon">${icon}</span>
            <span class="record-title">${typeText}</span>
            <div class="record-actions">
                <button class="btn-edit" onclick="editFeedingRecord('${record.id}')">✏️</button>
                <button class="btn-delete" onclick="deleteFeedingRecord('${record.id}')">🗑️</button>
            </div>
        </div>
        <div class="record-details">
            <div class="record-info">
                <span class="record-date">${formattedDate}</span>
                <span class="record-time">${formattedTime}</span>
            </div>
            <div class="record-duration">
                <span>${record.duration} мин.</span>
            </div>
        </div>
        ${record.notes ? `<div class="record-notes">${record.notes}</div>` : ''}
    `;
    
    return card;
}

function editFeedingRecord(id) {
    openFeedingModal(id);
}

function deleteFeedingRecord(id) {
    if (confirm('Сигурни ли сте, че искате да изтриете този запис?')) {
        feedingRecords = feedingRecords.filter(record => record.id !== id);
        saveFeedingRecordsToStorage();
        renderFeedingRecords();
        updateFeedingStats();
    }
}

function updateFeedingStats() {
    const totalFeedings = document.getElementById('totalFeedings');
    const todayFeedings = document.getElementById('todayFeedings');
    const avgFeedingTime = document.getElementById('avgFeedingTime');
    
    // Calculate total feedings
    totalFeedings.textContent = feedingRecords.length;
    
    // Calculate feedings today
    const today = new Date().toISOString().split('T')[0];
    const todayCount = feedingRecords.filter(record => 
        record.startTime.startsWith(today)
    ).length;
    todayFeedings.textContent = todayCount;
    
    // Calculate average feeding duration
    if (feedingRecords.length > 0) {
        const totalDuration = feedingRecords.reduce((sum, record) => sum + record.duration, 0);
        const average = Math.round(totalDuration / feedingRecords.length);
        avgFeedingTime.textContent = average;
    } else {
        avgFeedingTime.textContent = '0';
    }
}

// Helper function to generate unique ID
function generateId() {
    return 'feeding_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Expose functions to global scope
window.openFeedingModal = openFeedingModal;
window.editFeedingRecord = editFeedingRecord;
window.deleteFeedingRecord = deleteFeedingRecord;