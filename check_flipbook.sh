#!/bin/bash

echo "🌐 Открываю FlipBook в браузере для визуальной проверки..."
echo ""
echo "📍 URL: http://localhost:8002/flipbook.html"
echo ""
echo "✅ Что ДОЛЖНО быть видно:"
echo "   - Первая страница с текстом 'ANCIENT REAL ESTATE PROPERTIES'"
echo "   - Возможность перелистывания кнопками ◀ и ▶"
echo "   - Переключение страниц кликом по странице"
echo "   - Миниатюры при нажатии на кнопку 📑"
echo ""
echo "❌ Если вы видите:"
echo "   - Только цветной фон без текста и изображений"
echo "   - Пустые белые страницы"
echo "   → Значит проблема НЕ решена"
echo ""
echo "🔍 Проверьте консоль браузера (F12):"
echo ""
curl -s http://localhost:8002/flipbook.html > /tmp/flipbook_test.html

echo "📊 Проверяю, какие скрипты загружаются..."
echo ""

# Проверяем порядок загрузки
echo "1. Проверка наличия скриптов в HTML:"
grep -o '<script.*src=.*flipbook.js' /tmp/flipbook_test.html && echo "   ✅ flipbook.js найден" || echo "   ❌ flipbook.js НЕ найден!"

echo ""
echo "2. Проверка инициализации FlipBookController:"
grep -c "new FlipBookController" neo_output_v16_6_final/flipbook.js
if [ $? -eq 0 ]; then
    echo "   ✅ Контроллер инициализируется"
else
    echo "   ❌ Контроллер НЕ инициализируется!"
fi

echo ""
echo "3. Проверка порядка выполнения в setup():"
sed -n '/setup()/,/}/p' neo_output_v16_6_final/flipbook.js | grep -E "loadSlides|initFlipBook|setupControls" | head -5

echo ""
echo "4. Проверка loadSlides и loadIndexHTML:"
sed -n '/async loadSlides()/,/}/p' neo_output_v16_6_final/flipbook.js | grep -E "loadIndexHTML|await"

echo ""
echo "5. КРИТИЧЕСКАЯ ПРОВЕРКА: loadPageContent после Turn.js:"
sed -n '/\.turn\({/,/}\);$/p' neo_output_v16_6_final/flipbook.js | tail -20 | grep -A 3 "loadPageContent"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🔧 ДИАГНОСТИЧЕСКИЕ КОМАНДЫ ДЛЯ КОНСОЛИ БРАУЗЕРА (F12):"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "// 1. Проверка существования контроллера"
echo "window.flipbook"
echo ""
echo "// 2. Проверка загрузки index.html"
echo "window.flipbook.indexDocument"
echo ""
echo "// 3. Проверка слайдов"
echo "window.flipbook.slides.length"
echo ""
echo "// 4. Проверка первого слайда в indexDocument"
echo "window.flipbook.indexDocument.getElementById('slide1')"
echo ""
echo "// 5. Проверка page-content элементов"
echo "document.querySelectorAll('.page-content').length"
echo ""
echo "// 6. Проверка контента в первой странице"
echo "document.querySelector('.page-content[data-page=\"1\"]').children.length"
echo ""
echo "// 7. Проверка HTML контента"
echo "document.querySelector('.page-content[data-page=\"1\"]').innerHTML"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
