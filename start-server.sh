#!/bin/bash

echo "========================================"
echo "   МАМАФООД - Стартиране на сървър"
echo "========================================"
echo ""

# Проверка дали Python е инсталиран
if command -v python3 &> /dev/null; then
    echo "[✓] Python3 намерен!"
    echo ""
    echo "Стартиране на сървър на порт 8000..."
    echo ""
    echo "Отидете на: http://localhost:8000"
    echo ""
    echo "За спиране на сървъра натиснете Ctrl+C"
    echo ""
    python3 -m http.server 8000
    exit 0
fi

if command -v python &> /dev/null; then
    echo "[✓] Python намерен!"
    echo ""
    echo "Стартиране на сървър на порт 8000..."
    echo ""
    echo "Отидете на: http://localhost:8000"
    echo ""
    echo "За спиране на сървъра натиснете Ctrl+C"
    echo ""
    python -m SimpleHTTPServer 8000
    exit 0
fi

# Проверка за PHP
if command -v php &> /dev/null; then
    echo "[✓] PHP намерен!"
    echo ""
    echo "Стартиране на сървър на порт 8000..."
    echo ""
    echo "Отидете на: http://localhost:8000"
    echo ""
    echo "За спиране на сървъра натиснете Ctrl+C"
    echo ""
    php -S localhost:8000
    exit 0
fi

echo "[✗] Грешка: Python или PHP не са намерени!"
echo ""
echo "Моля, инсталирайте:"
echo "- Python 3 (включен в повечето Linux/Mac)"
echo "- или PHP"
echo ""
echo "Или използвайте Node.js:"
echo "  npx http-server -p 8000"
echo ""

