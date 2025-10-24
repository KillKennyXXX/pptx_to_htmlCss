# PPTX to HTML Converter v17.0 - Quick Start

## 🚀 Быстрый старт

### Установка

```bash
# 1. Установите зависимости
pip install -r requirements.txt

# 2. Установите браузер для Playwright
playwright install chromium
```

### Использование

```bash
# Базовая конвертация с TurnJS (по умолчанию)
python pptx_to_html.py presentation.pptx output_folder

# Простой слайдер без TurnJS
python pptx_to_html.py presentation.pptx output_folder --template default
```

### Результат

Откройте `output_folder/index.html` в браузере и наслаждайтесь!

**Возможности:**
- 📖 Реалистичное перелистывание страниц
- 🔍 Зум при клике на страницу
- 🖼️ Миниатюры для быстрой навигации
- ⌨️ Клавиши ← → для перелистывания
- 🖱️ Перетаскивание углов страниц мышью

## 📚 Что нового в v17.0

### ✨ TurnJS Integration

Теперь по умолчанию используется профессиональный шаблон TurnJS (`template_new`):
- Реалистичный 3D эффект перелистывания страниц
- Интерактивные миниатюры
- Функция зума
- Адаптивный дизайн

### 🔄 Автоматическая конвертация

```
PPTX → HTML/CSS → JPG изображения → TurnJS интерфейс
```

Все происходит автоматически!

### 🗂️ Структура выходных файлов

```
output_folder/
├── index.html          # TurnJS интерфейс
├── css/                # Стили TurnJS
├── js/                 # Библиотеки TurnJS
├── pages/              # Изображения слайдов
│   ├── 1.jpg           # Основное изображение
│   ├── 1-thumb.jpg     # Миниатюра
│   ├── 1-large.jpg     # Для зума
│   └── 1-regions.json  # Интерактивные зоны
└── images/             # Оригинальные изображения из PPTX
```

## 🛠️ Технические детали

### Зависимости

- `python-pptx` - Парсинг PPTX файлов
- `Pillow` - Обработка изображений (миниатюры)
- `playwright` - Рендеринг HTML в изображения

### Производительность

- 10 слайдов ≈ 10-20 секунд
- Зависит от сложности слайдов и производительности системы

### Совместимость

- Python 3.7+
- Windows / macOS / Linux
- Браузеры: Chrome, Firefox, Safari, Edge, IE9+

## 📖 Подробная документация

См. [TURNJS_INTEGRATION.md](TURNJS_INTEGRATION.md) для полной документации.

## ⚠️ Миграция со старых версий

### Если вы использовали v16.6 и ранее

**Изменения:**
- Старый `template/` больше не используется
- По умолчанию используется TurnJS (`template_new/`)
- Добавлен этап генерации изображений

**Для использования старого режима:**
```bash
python pptx_to_html.py file.pptx output --template default
```

Это создаст простой HTML слайдер без TurnJS.

## 🐛 Устранение неполадок

### Ошибка импорта playwright

```bash
pip install playwright
playwright install chromium
```

### Ошибка "Слайды не найдены"

Проверьте, что `index.html` содержит элементы с классом `.slide`

### Миниатюры не оптимизированы

```bash
pip install pillow
```

## 📝 Примеры

### Пример 1: Базовая конвертация

```bash
python pptx_to_html.py my_presentation.pptx ./output
```

### Пример 2: С указанием шаблона

```bash
# TurnJS (по умолчанию)
python pptx_to_html.py slides.pptx ./web_version --template turnjs

# Простой слайдер
python pptx_to_html.py slides.pptx ./simple_version --template default
```

### Пример 3: Интерактивное использование

```bash
python pptx_to_html.py
# Введите путь к PPTX файлу: presentation.pptx
# Папка для сохранения (Enter = 'pptx_output'): my_output
```

## 🎯 Возможности TurnJS

1. **Реалистичное перелистывание**
   - Клик на угол страницы → загиб и перелистывание
   - Плавные анимации
   - Реалистичные тени и градиенты

2. **Зум**
   - Клик по странице → увеличение
   - ESC для выхода из зума
   - Загрузка высококачественного изображения

3. **Навигация**
   - Миниатюры внизу страницы
   - Клавиши ← → для перелистывания
   - Кнопки "Вперед" / "Назад"

4. **Адаптивность**
   - Автоматическая подгонка под размер окна
   - Поддержка мобильных устройств (тач-жесты)
   - Ориентация альбомная/портретная

## 🔗 Ссылки

- [TurnJS Library](http://www.turnjs.com/)
- [Playwright Documentation](https://playwright.dev/)
- [python-pptx Documentation](https://python-pptx.readthedocs.io/)

## 📄 Лицензия

См. [LICENSE](LICENSE)

---

**Автор:** PPTX to HTML Converter Team  
**Версия:** 17.0  
**Дата:** 2024
