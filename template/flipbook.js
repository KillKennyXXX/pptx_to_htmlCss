/**
 * FlipBook JavaScript Controller
 * Управляет функциональностью перелистывания страниц
 */

class FlipBookController {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 0;
        this.zoomLevel = 1;
        this.slides = [];
        
        this.init();
    }
    
    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    async setup() {
        // Загружаем данные слайдов (ВАЖНО: await для завершения загрузки!)
        await this.loadSlides();
        
        // Инициализируем flipbook (теперь indexDocument уже загружен)
        this.initFlipBook();
        
        // Настраиваем элементы управления
        this.setupControls();
        
        // Создаем миниатюры
        this.createThumbnails();
        
        // Настраиваем клавиатуру
        this.setupKeyboard();
    }
    
    async loadSlides() {
        try {
            // Загружаем данные слайдов из metadata.json
            const response = await fetch('metadata.json');
            const data = await response.json();
            
            this.slides = data.slides || [];
            this.totalPages = this.slides.length;
            
            document.getElementById('total-pages').textContent = this.totalPages;
            document.getElementById('page-slider').max = this.totalPages;
            
            // НОВОЕ: Загружаем index.html для получения контента слайдов
            await this.loadIndexHTML();
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Fallback: загружаем из существующих слайдов
            this.loadSlidesFromDOM();
        }
    }
    
    async loadIndexHTML() {
        try {
            const response = await fetch('index.html');
            const html = await response.text();
            
            // Парсим HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Сохраняем ссылку на document с контентом слайдов
            this.indexDocument = doc;
            
            console.log('✓ index.html загружен успешно');
            console.log(`✓ Найдено слайдов: ${doc.querySelectorAll('[id^="slide"]').length}`);
            
            // Также загружаем CSS для слайдов
            await this.loadSlideCSS();
        } catch (error) {
            console.error('✗ Не удалось загрузить index.html:', error);
        }
    }
    
    async loadSlideCSS() {
        try {
            const response = await fetch('style.css');
            const css = await response.text();
            
            // Добавляем CSS в head если его еще нет
            if (!document.getElementById('slide-styles')) {
                const style = document.createElement('style');
                style.id = 'slide-styles';
                style.textContent = css;
                document.head.appendChild(style);
                console.log('✓ style.css загружен успешно');
            }
        } catch (error) {
            console.warn('✗ Не удалось загрузить style.css:', error);
        }
    }
    
    loadSlidesFromDOM() {
        const slideElements = document.querySelectorAll('.slide');
        this.slides = Array.from(slideElements).map((slide, index) => ({
            slide_num: index + 1,
            image: slide.dataset.image || `slide${index + 1}.jpg`
        }));
        this.totalPages = this.slides.length;
    }
    
    initFlipBook() {
        const $flipbook = $('#flipbook');
        
        // Добавляем страницы в flipbook
        this.slides.forEach((slide, index) => {
            const pageHtml = `
                <div class="page ${index === 0 ? 'cover' : ''} ${index === this.slides.length - 1 ? 'back-cover' : ''}" data-page="${slide.slide_num}">
                    <!-- Контент страницы загружается динамически -->
                </div>
            `;
            $flipbook.append(pageHtml);
        });
        
        // Инициализируем Turn.js с режимом журнала
        $flipbook.turn({
            // Режим двойных страниц (как в журнале)
            display: 'double',
            
            // Размеры одной страницы (для разворота умножатся на 2)
            width: 1600,
            height: 1200,
            
            // Центрирование
            autoCenter: true,
            
            // УЛУЧШЕННЫЕ эффекты перелистывания для видимого загиба
            elevation: 150,        // ← Увеличено с 50 до 150 для лучшего 3D эффекта
            gradients: true,       // Градиенты на страницах
            acceleration: true,    // Аппаратное ускорение
            
            // Увеличенная длительность для плавного эффекта
            duration: 1500,
            
            // Включаем все интерактивные режимы
            when: {
                turning: (event, page, view) => {
                    // Предотвращаем перелистывание за пределы
                    if (page > this.totalPages) {
                        event.preventDefault();
                        return;
                    }
                },
                turned: (event, page, view) => {
                    this.currentPage = page;
                    this.updatePageCounter();
                    this.updateThumbnails();
                    
                    // Загружаем контент текущей и соседних страниц
                    this.loadPageContent(page);
                    if (page > 1) this.loadPageContent(page - 1);
                    if (page < this.totalPages) this.loadPageContent(page + 1);
                    // В режиме double загружаем также следующую страницу для разворота
                    if (page + 1 <= this.totalPages) this.loadPageContent(page + 1);
                },
                // Добавляем эффект во время перелистывания
                start: (event, pageObject, corner) => {
                    if (pageObject && pageObject.next) {
                        $(pageObject.next).addClass('turning');
                    }
                },
                end: (event, pageObject, turned) => {
                    if (pageObject && pageObject.next) {
                        $(pageObject.next).removeClass('turning');
                    }
                },
                missing: (event, pages) => {
                    // Загружаем отсутствующие страницы
                    for (let i = 0; i < pages.length; i++) {
                        this.loadPageContent(pages[i]);
                    }
                }
            }
        });
        
        // Загружаем контент первых видимых страниц (в режиме double - это страницы 1 и 2)
        this.loadPageContent(1);
        if (this.totalPages > 1) {
            this.loadPageContent(2);
        }
        
        // ВАЖНО: Обновляем Turn.js после загрузки контента и включаем интерактивность
        setTimeout(() => {
            $flipbook.turn('size', 1600, 1200);
            
            // Принудительно включаем обработку событий мыши для всех страниц
            $('.page').each(function() {
                $(this).css({
                    'cursor': 'pointer',
                    'user-select': 'none'
                });
            });
            
            console.log('Turn.js обновлён после загрузки контента');
        }, 100);
        
        // ВАЖНО: Обновляем Turn.js после загрузки контента
        setTimeout(() => {
            $flipbook.turn('size', 1600, 1200);
            console.log('Turn.js обновлён после загрузки контента');
        }, 100);
    }
    
    loadPageContent(pageNum) {
        const slide = this.slides[pageNum - 1];
        if (!slide) return;
        
        // Ищем страницу напрямую (без page-content)
        const page = $(`.page[data-page="${pageNum}"]`);
        if (!page.length) return;
        
        // Проверяем, не загружен ли уже контент
        if (page.children().length > 0) {
            return; // Контент уже загружен
        }
        
        // НОВОЕ: Клонируем слайд из загруженного index.html
        if (this.indexDocument) {
            const slideElement = this.indexDocument.getElementById(`slide${pageNum}`);
            
            if (slideElement) {
                console.log(`✓ Загружаем слайд ${pageNum}`);
                
                // Клонируем элемент слайда
                const clonedSlide = slideElement.cloneNode(true);
                
                // Делаем слайд видимым и подгоняем размеры
                clonedSlide.style.display = 'block';
                clonedSlide.style.opacity = '1';
                clonedSlide.style.position = 'absolute';
                clonedSlide.style.top = '0';
                clonedSlide.style.left = '0';
                clonedSlide.style.width = '100%';
                clonedSlide.style.height = '100%';
                clonedSlide.style.margin = '0';
                clonedSlide.style.padding = '0';
                clonedSlide.style.boxShadow = 'none';
                clonedSlide.style.pointerEvents = 'none'; // CSS перезапишет это
                
                // Очищаем и добавляем клонированный слайд
                page.html('');
                page.append(clonedSlide);
                
                console.log(`✓ Слайд ${pageNum} успешно добавлен на страницу`);
                
                return;
            } else {
                console.warn(`✗ Слайд slide${pageNum} не найден в index.html`);
            }
        } else {
            console.warn('✗ index.html не загружен');
        }
        
        // Fallback: Если клонирование не удалось, показываем заглушку
        page.html(`
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: white;">
                <div style="text-align: center; color: #666;">
                    <h3>Слайд ${pageNum}</h3>
                    <p>Контент загружается...</p>
                </div>
            </div>
        `);
    }
    
    async loadPageHTML(pageNum, container) {
        // Эта функция больше не используется, но оставляем для совместимости
        console.log('loadPageHTML deprecated, using iframe instead');
    }
    
    setupControls() {
        // Кнопки навигации
        $('#prev-page').click(() => this.previousPage());
        $('#next-page').click(() => this.nextPage());
        $('#first-page').click(() => this.goToPage(1));
        $('#last-page').click(() => this.goToPage(this.totalPages));
        
        // Слайдер страниц
        $('#page-slider').on('input', (e) => {
            const page = parseInt(e.target.value);
            this.goToPage(page);
        });
        
        // Масштабирование
        $('#zoom-in').click(() => this.zoomIn());
        $('#zoom-out').click(() => this.zoomOut());
        
        // Полноэкранный режим
        $('#fullscreen').click(() => this.toggleFullscreen());
        
        // Миниатюры
        $('#thumbnails-btn').click(() => this.toggleThumbnails());
        $('#close-thumbnails').click(() => this.closeThumbnails());
    }
    
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.previousPage();
                    break;
                case 'ArrowRight':
                    this.nextPage();
                    break;
                case 'Home':
                    this.goToPage(1);
                    break;
                case 'End':
                    this.goToPage(this.totalPages);
                    break;
                case 'F11':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'Escape':
                    if (document.fullscreenElement) {
                        this.toggleFullscreen();
                    }
                    this.closeThumbnails();
                    break;
            }
        });
    }
    
    createThumbnails() {
        const grid = document.getElementById('thumbnails-grid');
        
        this.slides.forEach((slide, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.dataset.page = index + 1;
            
            if (index === 0) {
                thumbnail.classList.add('active');
            }
            
            // НОВОЕ: Клонируем слайд для миниатюры
            if (this.indexDocument) {
                const slideElement = this.indexDocument.getElementById(`slide${index + 1}`);
                
                if (slideElement) {
                    const clonedSlide = slideElement.cloneNode(true);
                    
                    // Настраиваем стили для миниатюры
                    clonedSlide.style.display = 'block';     // ← Делаем видимым
                    clonedSlide.style.opacity = '1';         // ← Убираем прозрачность
                    clonedSlide.style.width = '300px';
                    clonedSlide.style.height = '225px';
                    clonedSlide.style.transform = 'scale(0.25)';
                    clonedSlide.style.transformOrigin = 'top left';
                    clonedSlide.style.position = 'relative';
                    clonedSlide.style.pointerEvents = 'none';
                    clonedSlide.style.boxShadow = 'none';    // ← Убираем тень
                    
                    // Создаем контейнер для масштабированного слайда
                    const wrapper = document.createElement('div');
                    wrapper.style.width = '300px';
                    wrapper.style.height = '225px';
                    wrapper.style.overflow = 'hidden';
                    wrapper.style.position = 'relative';
                    
                    wrapper.appendChild(clonedSlide);
                    thumbnail.appendChild(wrapper);
                }
            } else {
                // Fallback: показываем заглушку
                const placeholder = document.createElement('div');
                placeholder.style.width = '300px';
                placeholder.style.height = '225px';
                placeholder.style.background = slide.background_color || '#f0f0f0';
                placeholder.style.display = 'flex';
                placeholder.style.alignItems = 'center';
                placeholder.style.justifyContent = 'center';
                placeholder.style.color = '#666';
                placeholder.textContent = index + 1;
                thumbnail.appendChild(placeholder);
            }
            
            const numberLabel = document.createElement('div');
            numberLabel.className = 'thumbnail-number';
            numberLabel.textContent = index + 1;
            thumbnail.appendChild(numberLabel);
            
            thumbnail.addEventListener('click', () => {
                this.goToPage(index + 1);
                this.closeThumbnails();
            });
            
            grid.appendChild(thumbnail);
        });
    }
    
    updateThumbnails() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach(thumb => {
            const page = parseInt(thumb.dataset.page);
            thumb.classList.toggle('active', page === this.currentPage);
        });
    }
    
    onPageTurn(newPage) {
        // Предзагружаем контент соседних страниц
        this.loadPageContent(newPage);
        if (newPage > 1) this.loadPageContent(newPage - 1);
        if (newPage < this.totalPages) this.loadPageContent(newPage + 1);
    }
    
    previousPage() {
        $('#flipbook').turn('previous');
    }
    
    nextPage() {
        $('#flipbook').turn('next');
    }
    
    goToPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) return;
        $('#flipbook').turn('page', pageNum);
    }
    
    updatePageCounter() {
        // В режиме double отображаем разворот (кроме первой и последней)
        let displayText;
        if (this.currentPage === 1) {
            // Первая страница - обложка
            displayText = `1`;
        } else if (this.currentPage === this.totalPages) {
            // Последняя страница
            displayText = `${this.totalPages}`;
        } else {
            // Разворот: текущая и следующая страницы
            const nextPage = this.currentPage + 1;
            if (nextPage <= this.totalPages) {
                displayText = `${this.currentPage}-${nextPage}`;
            } else {
                displayText = `${this.currentPage}`;
            }
        }
        
        document.getElementById('current-page').textContent = displayText;
        document.getElementById('page-slider').value = this.currentPage;
        
        // Обновляем состояние кнопок
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('first-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === this.totalPages;
        document.getElementById('last-page').disabled = this.currentPage === this.totalPages;
    }
    
    zoomIn() {
        const wrapper = document.querySelector('.flipbook-wrapper');
        wrapper.classList.remove('zoomed-out');
        wrapper.classList.add('zoomed');
        this.zoomLevel = 1.2;
    }
    
    zoomOut() {
        const wrapper = document.querySelector('.flipbook-wrapper');
        wrapper.classList.remove('zoomed');
        wrapper.classList.add('zoomed-out');
        this.zoomLevel = 0.7;
    }
    
    toggleFullscreen() {
        const container = document.querySelector('.flipbook-container');
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('Ошибка входа в полноэкранный режим:', err);
            });
            container.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            container.classList.remove('fullscreen');
        }
    }
    
    toggleThumbnails() {
        const panel = document.getElementById('thumbnails-panel');
        panel.classList.toggle('open');
    }
    
    closeThumbnails() {
        const panel = document.getElementById('thumbnails-panel');
        panel.classList.remove('open');
    }
}

// Инициализируем контроллер при загрузке страницы
const flipbook = new FlipBookController();
