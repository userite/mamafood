// Функции за визуализация на данни
let milkAmountChart, feedingChart, feedingTypeChart;

// Инициализиране на графиките
function initCharts() {
    // Графика за количество кърма по дни
    const milkCtx = document.getElementById('milkAmountChart').getContext('2d');
    milkAmountChart = new Chart(milkCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Количество (мл)',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Графика за хранения по дни
    const feedingCtx = document.getElementById('feedingChart').getContext('2d');
    feedingChart = new Chart(feedingCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Брой хранения',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Графика за тип хранене
    const typeCtx = document.getElementById('feedingTypeChart').getContext('2d');
    feedingTypeChart = new Chart(typeCtx, {
        type: 'pie',
        data: {
            labels: ['Кърма', 'Адаптирано мляко', 'Твърда храна'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Обновяване на графиките с данни
function updateCharts() {
    updateMilkAmountChart();
    updateFeedingCharts();
}

// Обновяване на графиката за количество кърма
function updateMilkAmountChart() {
    if (!milkAmountChart) return;
    
    // Вземане на записите от локалното хранилище
    const records = JSON.parse(localStorage.getItem('milkRecords')) || [];
    
    // Групиране на данните по дата
    const dateGroups = {};
    records.forEach(record => {
        const date = new Date(record.datetime).toLocaleDateString();
        if (!dateGroups[date]) {
            dateGroups[date] = 0;
        }
        dateGroups[date] += parseInt(record.amount) || 0;
    });
    
    // Подготовка на данните за графиката
    const labels = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
    const data = labels.map(date => dateGroups[date]);
    
    // Обновяване на графиката
    milkAmountChart.data.labels = labels;
    milkAmountChart.data.datasets[0].data = data;
    milkAmountChart.update();
}

// Обновяване на графиките за хранения
function updateFeedingCharts() {
    if (!feedingChart || !feedingTypeChart || !feedingRecords) return;
    
    // Групиране на данните по дата
    const dateGroups = {};
    const typeGroups = {
        'breast': 0,
        'bottle': 0,
        'solid': 0
    };
    
    feedingRecords.forEach(record => {
        const date = new Date(record.startTime).toLocaleDateString();
        if (!dateGroups[date]) {
            dateGroups[date] = 0;
        }
        dateGroups[date]++;
        
        // Броене по тип
        if (record.feedingType) {
            typeGroups[record.feedingType]++;
        }
    });
    
    // Подготовка на данните за графиката по дни
    const labels = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
    const data = labels.map(date => dateGroups[date]);
    
    // Обновяване на графиката по дни
    feedingChart.data.labels = labels;
    feedingChart.data.datasets[0].data = data;
    feedingChart.update();
    
    // Обновяване на графиката по тип
    feedingTypeChart.data.datasets[0].data = [
        typeGroups.breast,
        typeGroups.bottle,
        typeGroups.solid
    ];
    feedingTypeChart.update();
}

// Инициализиране на графиките при зареждане на страницата
document.addEventListener('DOMContentLoaded', function() {
    // Изчакваме малко, за да се заредят данните
    setTimeout(() => {
        initCharts();
        updateCharts();
    }, 500);
});

// Обновяване на графиките при промяна на данните
document.addEventListener('recordsUpdated', function() {
    updateCharts();
});

document.addEventListener('feedingRecordsUpdated', function() {
    updateCharts();
});