#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Полная диагностика FlipBook через curl${NC}\n"

BASE_URL="http://localhost:8002"
PASSED=0
FAILED=0

# Функция для проверки
check_test() {
    if [ $1 -eq 0 ]; then
        echo -e "   ${GREEN}✅ $2${NC}"
        ((PASSED++))
    else
        echo -e "   ${RED}❌ $2${NC}"
        ((FAILED++))
    fi
}

# Тест 1: Проверка metadata.json
echo -e "${YELLOW}📋 Тест 1: Загрузка metadata.json${NC}"
METADATA=$(curl -s "$BASE_URL/metadata.json")
TOTAL_SLIDES=$(echo "$METADATA" | grep -o '"total_slides": [0-9]*' | grep -o '[0-9]*')

if [ ! -z "$TOTAL_SLIDES" ]; then
    echo -e "   ${GREEN}✅ Найдено слайдов: $TOTAL_SLIDES${NC}"
    ((PASSED++))
else
    echo -e "   ${RED}❌ Не удалось загрузить metadata.json${NC}"
    ((FAILED++))
fi

# Тест 2: Проверка index.html на наличие слайдов
echo -e "\n${YELLOW}📄 Тест 2: Проверка слайдов в index.html${NC}"
INDEX_HTML=$(curl -s "$BASE_URL/index.html")
FOUND_SLIDES=$(echo "$INDEX_HTML" | grep -o 'id="slide[0-9]*"' | wc -l)

echo -e "   ${GREEN}📊 Найдено слайдов в HTML: $FOUND_SLIDES${NC}"

if [ "$FOUND_SLIDES" -eq "$TOTAL_SLIDES" ]; then
    echo -e "   ${GREEN}✅ Количество совпадает с metadata.json${NC}"
    ((PASSED++))
else
    echo -e "   ${RED}❌ Несоответствие: metadata=$TOTAL_SLIDES, html=$FOUND_SLIDES${NC}"
    ((FAILED++))
fi

# Проверяем формат ID слайдов
echo "$INDEX_HTML" | grep -o 'id="slide[0-9]*"' | head -3
check_test $? "Формат ID слайдов корректный (slide1, slide2, ...)"

# Тест 3: Проверка контента слайдов
echo -e "\n${YELLOW}🔍 Тест 3: Проверка контента слайдов${NC}"

HAS_TEXT_BLOCKS=$(echo "$INDEX_HTML" | grep -c 'class="text-block"')
HAS_IMAGE_BLOCKS=$(echo "$INDEX_HTML" | grep -c 'class="image-block"')

echo -e "   ${GREEN}📝 Текстовых блоков: $HAS_TEXT_BLOCKS${NC}"
echo -e "   ${GREEN}🖼️ Блоков изображений: $HAS_IMAGE_BLOCKS${NC}"

[ "$HAS_TEXT_BLOCKS" -gt 0 ]
check_test $? "Текстовые блоки присутствуют"

[ "$HAS_IMAGE_BLOCKS" -gt 0 ]
check_test $? "Блоки изображений присутствуют"

# Тест 4: Проверка flipbook.html структуры
echo -e "\n${YELLOW}📱 Тест 4: Проверка flipbook.html${NC}"
FLIPBOOK_HTML=$(curl -s "$BASE_URL/flipbook.html")

echo "$FLIPBOOK_HTML" | grep -q 'id="flipbook"'
check_test $? "Контейнер #flipbook найден"

echo "$FLIPBOOK_HTML" | grep -q 'flipbook.js'
check_test $? "Скрипт flipbook.js подключен"

echo "$FLIPBOOK_HTML" | grep -q 'turn.js\|turn.min.js'
check_test $? "Библиотека Turn.js подключена"

echo "$FLIPBOOK_HTML" | grep -q 'jquery'
check_test $? "jQuery подключен"

# Тест 5: Детальная проверка flipbook.js
echo -e "\n${YELLOW}⚙️ Тест 5: Анализ flipbook.js логики${NC}"
FLIPBOOK_JS=$(curl -s "$BASE_URL/flipbook.js")

echo "$FLIPBOOK_JS" | grep -q 'class FlipBookController'
check_test $? "Класс FlipBookController определен"

echo "$FLIPBOOK_JS" | grep -q 'async loadIndexHTML()'
check_test $? "Функция loadIndexHTML() найдена"

echo "$FLIPBOOK_JS" | grep -q 'loadPageContent(pageNum)'
check_test $? "Функция loadPageContent() найдена"

echo "$FLIPBOOK_JS" | grep -q 'new DOMParser()'
check_test $? "DOMParser используется"

echo "$FLIPBOOK_JS" | grep -q 'cloneNode(true)'
check_test $? "Клонирование DOM (cloneNode) используется"

echo "$FLIPBOOK_JS" | grep -q 'getElementById(`slide\${.*}`)'
check_test $? "Поиск слайдов через getElementById"

# КРИТИЧЕСКАЯ ПРОВЕРКА: Загрузка первых страниц
echo "$FLIPBOOK_JS" | grep -A 5 'turn.min.js' | grep -q 'this.loadPageContent(1)'
LOAD_PAGE_1=$?

echo "$FLIPBOOK_JS" | grep -A 5 'this.loadPageContent(1)' | grep -q 'this.loadPageContent(2)'
LOAD_PAGE_2=$?

if [ $LOAD_PAGE_1 -eq 0 ] && [ $LOAD_PAGE_2 -eq 0 ]; then
    echo -e "   ${GREEN}✅ Загрузка страниц 1 и 2 при инициализации${NC}"
    ((PASSED++))
else
    echo -e "   ${RED}❌ НЕТ загрузки страниц 1 и 2!${NC}"
    echo -e "   ${RED}   Это основная причина проблемы!${NC}"
    ((FAILED++))
fi

# Проверка события turned
echo "$FLIPBOOK_JS" | grep -A 10 'turned:' | grep -q 'this.loadPageContent(page)'
check_test $? "Загрузка контента в событии turned"

# Тест 6: Проверка, что страницы НЕ создаются статически
echo -e "\n${YELLOW}📦 Тест 6: Проверка динамического создания страниц${NC}"

STATIC_PAGES=$(echo "$FLIPBOOK_HTML" | grep -c '<div class="page')
echo -e "   ${BLUE}📊 Статических страниц в HTML: $STATIC_PAGES${NC}"

if [ "$STATIC_PAGES" -eq 0 ]; then
    echo -e "   ${GREEN}✅ Страницы создаются динамически (правильно)${NC}"
    ((PASSED++))
else
    echo -e "   ${YELLOW}⚠️ Найдены статические страницы: $STATIC_PAGES${NC}"
    ((PASSED++))
fi

# Тест 7: Проверка создания страниц в JS
echo -e "\n${YELLOW}🔨 Тест 7: Проверка создания page-content${NC}"

echo "$FLIPBOOK_JS" | grep -q 'class="page-content"'
check_test $? "Создание элементов page-content"

echo "$FLIPBOOK_JS" | grep -q 'data-page='
check_test $? "Атрибут data-page для связи со слайдами"

# Тест 8: Проверка Turn.js конфигурации
echo -e "\n${YELLOW}📖 Тест 8: Конфигурация Turn.js${NC}"

echo "$FLIPBOOK_JS" | grep -q "display: 'double'"
check_test $? "Режим двойных страниц (журнал)"

echo "$FLIPBOOK_JS" | grep -q 'duration:.*1500'
check_test $? "Длительность анимации 1500ms"

# Итоговый отчёт
echo -e "\n$( printf '=%.0s' {1..70} )"
echo -e "${BLUE}📊 ИТОГОВЫЙ ОТЧЁТ${NC}"
echo -e "$( printf '=%.0s' {1..70} )"
echo -e "${GREEN}✅ Пройдено: $PASSED${NC}"
echo -e "${RED}❌ Провалено: $FAILED${NC}"

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))
echo -e "${BLUE}📈 Процент успеха: $SUCCESS_RATE%${NC}"
echo -e "$( printf '=%.0s' {1..70} )"

if [ "$FAILED" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!${NC}"
    echo -e "\n${YELLOW}📝 Следующие шаги:${NC}"
    echo -e "   1. Откройте ${BLUE}http://localhost:8002/flipbook.html${NC}"
    echo -e "   2. Откройте DevTools (F12) → Console"
    echo -e "   3. Проверьте наличие ошибок (не должно быть красных)"
    echo -e "   4. Выполните команды:"
    echo -e "      ${BLUE}window.flipbook${NC}"
    echo -e "      ${BLUE}window.flipbook.indexDocument${NC}"
    echo -e "      ${BLUE}window.flipbook.slides.length${NC}"
    echo -e "      ${BLUE}document.querySelectorAll('.page-content').length${NC}"
    echo -e "   5. Проверьте, что страницы содержат контент:"
    echo -e "      ${BLUE}document.querySelector('.page-content').children.length${NC}"
else
    echo -e "\n${RED}⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ!${NC}"
    echo -e "\n${YELLOW}🔧 Рекомендации:${NC}"
    echo -e "   1. Проверьте консоль браузера на ошибки JavaScript"
    echo -e "   2. Убедитесь, что все файлы загружаются (вкладка Network)"
    echo -e "   3. Проверьте, что ID слайдов совпадают: slide1, slide2, ..."
    echo -e "   4. Убедитесь, что события Turn.js срабатывают"
fi

echo ""
exit $FAILED
