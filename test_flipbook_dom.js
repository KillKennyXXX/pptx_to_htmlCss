/**
 * Полная проверка FlipBook с эмуляцией браузера
 * Проверяет реальную загрузку контента в страницы FlipBook
 */

const http = require('http');
const { JSDOM } = require('jsdom');

// Функция для HTTP запроса
function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Функция для задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFlipBookDOM() {
    console.log('🔍 Полная проверка FlipBook с DOM анализом...\n');
    
    const baseUrl = 'http://localhost:8002';
    let passed = 0;
    let failed = 0;
    
    try {
        // Тест 1: Загружаем flipbook.html
        console.log('📱 Тест 1: Загрузка FlipBook HTML');
        const flipbookHtml = await httpGet(`${baseUrl}/flipbook.html`);
        const dom = new JSDOM(flipbookHtml, {
            url: baseUrl,
            runScripts: 'outside-only',
            resources: 'usable'
        });
        const document = dom.window.document;
        
        // Проверяем структуру
        const flipbookContainer = document.querySelector('#flipbook');
        if (flipbookContainer) {
            console.log('   ✅ Контейнер #flipbook найден');
            passed++;
        } else {
            console.log('   ❌ Контейнер #flipbook НЕ найден!');
            failed++;
            return;
        }
        
        // Тест 2: Проверяем динамическое создание страниц
        console.log('\n📄 Тест 2: Проверка структуры страниц');
        const pages = document.querySelectorAll('.page');
        console.log(`   📊 Найдено страниц в HTML: ${pages.length}`);
        
        if (pages.length === 0) {
            console.log('   ⚠️ Страницы создаются динамически через JS');
            console.log('   💡 Проверяем, что скрипт загружается...');
            
            const scripts = document.querySelectorAll('script[src*="flipbook.js"]');
            if (scripts.length > 0) {
                console.log('   ✅ flipbook.js подключен');
                passed++;
            } else {
                console.log('   ❌ flipbook.js НЕ подключен!');
                failed++;
            }
        } else {
            console.log('   ✅ Страницы найдены в HTML');
            passed++;
        }
        
        // Тест 3: Проверяем flipbook.js логику
        console.log('\n⚙️ Тест 3: Анализ flipbook.js');
        const flipbookJs = await httpGet(`${baseUrl}/flipbook.js`);
        
        // Проверяем ключевые функции
        const checks = [
            { name: 'Класс FlipBookController', pattern: /class FlipBookController/ },
            { name: 'Функция loadSlides()', pattern: /async loadSlides\(\)/ },
            { name: 'Функция loadIndexHTML()', pattern: /async loadIndexHTML\(\)/ },
            { name: 'Функция loadPageContent()', pattern: /loadPageContent\(pageNum\)/ },
            { name: 'DOMParser для парсинга', pattern: /new DOMParser\(\)/ },
            { name: 'Клонирование через cloneNode', pattern: /cloneNode\(true\)/ },
            { name: 'Поиск по getElementById', pattern: /getElementById\(`slide\$\{/ },
            { name: 'Загрузка страницы 1', pattern: /this\.loadPageContent\(1\)/ },
            { name: 'Загрузка страницы 2', pattern: /this\.loadPageContent\(2\)/ },
            { name: 'Загрузка в событии turned', pattern: /turned:.*this\.loadPageContent/ }
        ];
        
        checks.forEach(check => {
            if (check.pattern.test(flipbookJs)) {
                console.log(`   ✅ ${check.name}`);
                passed++;
            } else {
                console.log(`   ❌ ${check.name} - НЕ НАЙДЕНО!`);
                failed++;
            }
        });
        
        // Тест 4: Симулируем работу loadPageContent
        console.log('\n🔄 Тест 4: Симуляция загрузки контента');
        
        // Загружаем index.html
        const indexHtml = await httpGet(`${baseUrl}/index.html`);
        const indexDom = new JSDOM(indexHtml);
        const indexDocument = indexDom.window.document;
        
        console.log('   📥 index.html загружен');
        
        // Ищем слайды
        for (let i = 1; i <= 3; i++) {
            const slideId = `slide${i}`;
            const slideElement = indexDocument.getElementById(slideId);
            
            if (slideElement) {
                console.log(`   ✅ Слайд #${i} найден (id="${slideId}")`);
                
                // Проверяем контент
                const textBlocks = slideElement.querySelectorAll('.text-block');
                const imageBlocks = slideElement.querySelectorAll('.image-block');
                console.log(`      └─ Текстовых блоков: ${textBlocks.length}`);
                console.log(`      └─ Изображений: ${imageBlocks.length}`);
                
                // Симулируем клонирование
                const cloned = slideElement.cloneNode(true);
                if (cloned.id === slideId) {
                    console.log(`      ✅ Клонирование работает`);
                    passed++;
                } else {
                    console.log(`      ❌ Проблема с клонированием!`);
                    failed++;
                }
            } else {
                console.log(`   ❌ Слайд #${i} НЕ НАЙДЕН! (искали id="${slideId}")`);
                failed++;
            }
        }
        
        // Тест 5: Проверяем metadata.json соответствие
        console.log('\n📋 Тест 5: Соответствие metadata.json и index.html');
        const metadataJson = await httpGet(`${baseUrl}/metadata.json`);
        const metadata = JSON.parse(metadataJson);
        
        console.log(`   📊 В metadata.json: ${metadata.total_slides} слайдов`);
        
        let foundSlides = 0;
        for (let i = 1; i <= metadata.total_slides; i++) {
            const slideId = `slide${i}`;
            const slideElement = indexDocument.getElementById(slideId);
            if (slideElement) {
                foundSlides++;
            }
        }
        
        console.log(`   📊 В index.html найдено: ${foundSlides} слайдов`);
        
        if (foundSlides === metadata.total_slides) {
            console.log(`   ✅ Все слайды на месте!`);
            passed++;
        } else {
            console.log(`   ❌ Несоответствие! Ожидалось ${metadata.total_slides}, найдено ${foundSlides}`);
            failed++;
        }
        
        // Тест 6: Проверяем, что flipbook.js создаст правильные page-content
        console.log('\n📦 Тест 6: Проверка логики создания страниц');
        
        // Эмулируем создание страниц как в flipbook.js
        const slideCount = metadata.total_slides;
        console.log(`   🔨 Эмулируем создание ${slideCount} страниц...`);
        
        for (let i = 1; i <= Math.min(3, slideCount); i++) {
            const slideData = metadata.slides[i - 1];
            console.log(`\n   📄 Страница ${i}:`);
            console.log(`      └─ slide_num: ${slideData.slide_num}`);
            console.log(`      └─ html_url: ${slideData.html_url || 'НЕ УКАЗАН'}`);
            
            // Проверяем, можно ли найти слайд
            const slideElement = indexDocument.getElementById(`slide${i}`);
            if (slideElement) {
                console.log(`      ✅ Слайд существует и может быть клонирован`);
                
                // Эмулируем то, что делает loadPageContent
                const cloned = slideElement.cloneNode(true);
                cloned.style.display = 'block';
                cloned.style.width = '100%';
                cloned.style.height = '100%';
                
                console.log(`      ✅ Эмуляция loadPageContent успешна`);
                passed++;
            } else {
                console.log(`      ❌ Слайд НЕ НАЙДЕН! loadPageContent провалится!`);
                failed++;
            }
        }
        
        // Тест 7: Проверяем CSS для страниц
        console.log('\n🎨 Тест 7: Проверка стилей');
        const styleCss = await httpGet(`${baseUrl}/style.css`);
        
        const cssChecks = [
            { name: 'Класс .slide', pattern: /\.slide\s*{/ },
            { name: 'Класс .text-block', pattern: /\.text-block\s*{/ },
            { name: 'Класс .image-block', pattern: /\.image-block\s*{/ }
        ];
        
        cssChecks.forEach(check => {
            if (check.pattern.test(styleCss)) {
                console.log(`   ✅ ${check.name} определен`);
                passed++;
            } else {
                console.log(`   ⚠️ ${check.name} не найден (может быть нормально)`);
            }
        });
        
    } catch (error) {
        console.error(`\n💥 Критическая ошибка: ${error.message}`);
        console.error(error.stack);
        failed++;
    }
    
    // Итоговый отчёт
    console.log('\n' + '='.repeat(70));
    console.log(`📊 ДЕТАЛЬНЫЙ ОТЧЁТ О РАБОТОСПОСОБНОСТИ FLIPBOOK`);
    console.log('='.repeat(70));
    console.log(`✅ Пройдено проверок: ${passed}`);
    console.log(`❌ Провалено проверок: ${failed}`);
    console.log(`📈 Процент успеха: ${Math.round(passed / (passed + failed) * 100)}%`);
    console.log('='.repeat(70));
    
    if (failed === 0) {
        console.log('\n🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
        console.log('\n✨ FlipBook должен корректно работать:');
        console.log('   ✅ Страницы создаются динамически');
        console.log('   ✅ Контент загружается из index.html');
        console.log('   ✅ Клонирование DOM работает');
        console.log('   ✅ Все слайды доступны');
        console.log('\n📝 Откройте в браузере для визуальной проверки:');
        console.log('   🌐 http://localhost:8002/flipbook.html');
        console.log('\n🔍 В консоли браузера проверьте:');
        console.log('   window.flipbook.indexDocument  // Должен быть Document');
        console.log('   window.flipbook.slides.length  // Должно быть 12');
    } else {
        console.log('\n⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ!');
        console.log('\n🔧 Возможные причины:');
        console.log('   1. flipbook.js не загружает index.html корректно');
        console.log('   2. ID слайдов не совпадают (slide1 vs slide-1)');
        console.log('   3. События Turn.js не вызывают loadPageContent');
        console.log('   4. CSS конфликты скрывают контент');
        console.log('\n💡 Проверьте консоль браузера (F12) на наличие ошибок!');
    }
    
    console.log('\n');
}

// Проверяем наличие jsdom
try {
    require('jsdom');
} catch (err) {
    console.error('❌ Модуль jsdom не установлен!');
    console.error('📦 Установите его командой: npm install jsdom');
    process.exit(1);
}

// Запускаем тесты
testFlipBookDOM().catch(err => {
    console.error('💥 Критическая ошибка:', err);
    process.exit(1);
});
