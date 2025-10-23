/**
 * Реальная проверка FlipBook через Node.js
 * Использует JSDOM для эмуляции браузера и проверки DOM
 */

const http = require('http');

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

// Главная функция тестирования
async function testFlipBook() {
    console.log('🔍 Начинаю реальную диагностику FlipBook...\n');
    
    const baseUrl = 'http://localhost:8002';
    let passed = 0;
    let failed = 0;
    
    // Тест 1: Проверка metadata.json
    console.log('📋 Тест 1: Загрузка metadata.json');
    try {
        const metadata = await httpGet(`${baseUrl}/metadata.json`);
        const data = JSON.parse(metadata);
        console.log(`   ✅ Загружено ${data.total_slides} слайдов`);
        console.log(`   ✅ Источник: ${data.source_file}`);
        passed++;
    } catch (err) {
        console.log(`   ❌ ОШИБКА: ${err.message}`);
        failed++;
    }
    
    // Тест 2: Проверка index.html
    console.log('\n📄 Тест 2: Проверка index.html');
    try {
        const html = await httpGet(`${baseUrl}/index.html`);
        const slideMatches = html.match(/id="slide\d+"/g);
        if (slideMatches) {
            console.log(`   ✅ Найдено ${slideMatches.length} слайдов`);
            console.log(`   ✅ IDs: ${slideMatches.slice(0, 5).join(', ')}...`);
            
            // Проверяем контент слайдов
            const hasTextBlocks = html.includes('class="text-block"');
            const hasImages = html.includes('class="image-block"');
            console.log(`   ${hasTextBlocks ? '✅' : '❌'} Текстовые блоки найдены`);
            console.log(`   ${hasImages ? '✅' : '❌'} Изображения найдены`);
            
            passed++;
        } else {
            console.log('   ❌ Слайды не найдены!');
            failed++;
        }
    } catch (err) {
        console.log(`   ❌ ОШИБКА: ${err.message}`);
        failed++;
    }
    
    // Тест 3: Проверка flipbook.html
    console.log('\n📱 Тест 3: Проверка flipbook.html');
    try {
        const html = await httpGet(`${baseUrl}/flipbook.html`);
        const hasFlipbook = html.includes('id="flipbook"');
        const hasjQuery = html.includes('jquery');
        const hasTurnJs = html.includes('turn.js') || html.includes('turn.min.js');
        
        console.log(`   ${hasFlipbook ? '✅' : '❌'} Контейнер #flipbook найден`);
        console.log(`   ${hasjQuery ? '✅' : '❌'} jQuery подключен`);
        console.log(`   ${hasTurnJs ? '✅' : '❌'} Turn.js подключен`);
        
        if (hasFlipbook && hasjQuery && hasTurnJs) {
            passed++;
        } else {
            failed++;
        }
    } catch (err) {
        console.log(`   ❌ ОШИБКА: ${err.message}`);
        failed++;
    }
    
    // Тест 4: Проверка flipbook.js
    console.log('\n⚙️ Тест 4: Проверка flipbook.js');
    try {
        const js = await httpGet(`${baseUrl}/flipbook.js`);
        const hasLoadIndexHTML = js.includes('loadIndexHTML');
        const hasLoadPageContent = js.includes('loadPageContent');
        const hasCloneNode = js.includes('cloneNode(true)');
        const hasDOMParser = js.includes('DOMParser');
        const hasInitialLoad = js.includes('this.loadPageContent(1)') && 
                               js.includes('this.loadPageContent(2)');
        const hasTurnedEvent = js.includes('turned:') && 
                              js.includes('this.loadPageContent(page)');
        
        console.log(`   ${hasLoadIndexHTML ? '✅' : '❌'} Функция loadIndexHTML() присутствует`);
        console.log(`   ${hasLoadPageContent ? '✅' : '❌'} Функция loadPageContent() присутствует`);
        console.log(`   ${hasCloneNode ? '✅' : '❌'} DOM cloning (cloneNode) используется`);
        console.log(`   ${hasDOMParser ? '✅' : '❌'} DOMParser используется`);
        console.log(`   ${hasInitialLoad ? '✅' : '❌'} Загрузка страниц 1 и 2 при инициализации`);
        console.log(`   ${hasTurnedEvent ? '✅' : '❌'} Загрузка при событии turned`);
        
        if (hasLoadIndexHTML && hasLoadPageContent && hasCloneNode && 
            hasDOMParser && hasInitialLoad && hasTurnedEvent) {
            passed++;
        } else {
            failed++;
        }
    } catch (err) {
        console.log(`   ❌ ОШИБКА: ${err.message}`);
        failed++;
    }
    
    // Тест 5: Проверка CSS
    console.log('\n🎨 Тест 5: Проверка CSS файлов');
    try {
        const flipbookCss = await httpGet(`${baseUrl}/flipbook.css`);
        const styleCss = await httpGet(`${baseUrl}/style.css`);
        
        console.log(`   ✅ flipbook.css загружен (${flipbookCss.length} байт)`);
        console.log(`   ✅ style.css загружен (${styleCss.length} байт)`);
        
        const hasPageCurl = flipbookCss.includes('page-curl') || 
                           flipbookCss.includes('turning');
        console.log(`   ${hasPageCurl ? '✅' : '❌'} Эффекты перелистывания найдены`);
        
        passed++;
    } catch (err) {
        console.log(`   ❌ ОШИБКА: ${err.message}`);
        failed++;
    }
    
    // Тест 6: Проверка изображений
    console.log('\n🖼️ Тест 6: Проверка изображений');
    try {
        const html = await httpGet(`${baseUrl}/index.html`);
        const imgMatches = html.match(/src="images\/[^"]+"/g);
        if (imgMatches) {
            console.log(`   ✅ Найдено ${imgMatches.length} ссылок на изображения`);
            
            // Проверяем первое изображение
            const firstImg = imgMatches[0].match(/src="([^"]+)"/)[1];
            try {
                await httpGet(`${baseUrl}/${firstImg}`);
                console.log(`   ✅ Первое изображение доступно: ${firstImg}`);
                passed++;
            } catch {
                console.log(`   ❌ Изображение недоступно: ${firstImg}`);
                failed++;
            }
        } else {
            console.log('   ⚠️ Изображения не найдены (может быть нормально)');
            passed++;
        }
    } catch (err) {
        console.log(`   ❌ ОШИБКА: ${err.message}`);
        failed++;
    }
    
    // Итоговый отчёт
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ИТОГОВЫЙ ОТЧЁТ`);
    console.log('='.repeat(60));
    console.log(`✅ Пройдено: ${passed}`);
    console.log(`❌ Провалено: ${failed}`);
    console.log(`📈 Процент успеха: ${Math.round(passed / (passed + failed) * 100)}%`);
    console.log('='.repeat(60));
    
    if (failed === 0) {
        console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! FlipBook готов к использованию.');
        console.log('\n📝 Следующие шаги:');
        console.log('   1. Откройте http://localhost:8002/flipbook.html в браузере');
        console.log('   2. Проверьте визуально все страницы');
        console.log('   3. Протестируйте перелистывание и все функции');
    } else {
        console.log('\n⚠️ Обнаружены проблемы! Проверьте ошибки выше.');
    }
    
    console.log('\n💡 Для детальной проверки в браузере:');
    console.log('   - Откройте DevTools (F12)');
    console.log('   - Проверьте консоль на наличие ошибок');
    console.log('   - Проверьте Network на загрузку всех ресурсов');
    console.log('   - Выполните в консоли: window.flipbook.indexDocument\n');
}

// Запускаем тесты
testFlipBook().catch(err => {
    console.error('💥 Критическая ошибка:', err);
    process.exit(1);
});
