# 🎨 PPTX to HTML Converter

> Convert PowerPoint presentations to responsive HTML pages with **pixel-perfect style preservation**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![PPTX](https://img.shields.io/badge/PowerPoint-PPTX-orange.svg)](https://python-pptx.readthedocs.io/)

---

## 🎯 What's New in v17.0?

### 📄 Individual Page Files
Каждый слайд презентации теперь сохраняется в **отдельный HTML файл**:

- ✅ **Отдельные страницы** - каждый слайд в папке `pages/`
- ✅ **Общий CSS** - единый файл стилей для всех страниц
- ✅ **Навигация** - удобная навигация между страницами
- ✅ **Главная страница** - индексная страница со списком всех слайдов

```bash
# Конвертация презентации
python pptx_to_html.py "presentation.pptx" output
```

---

## 🎯 Why Use This Converter?

**Transform PowerPoint designs into production-ready web code automatically.**

### Key Benefits

✅ **Save Time** - No manual HTML/CSS recreation needed  
✅ **Pixel-Perfect** - Exact positioning and styling preserved  
✅ **Complete Conversion** - Text, images, tables, shapes, backgrounds  
✅ **Responsive** - Scales perfectly on all devices  
✅ **Production-Ready** - Clean HTML/CSS code with navigation  
✅ **Individual Pages** - Each slide as separate HTML file  

## 📌 Description

A powerful Python script for converting PowerPoint presentations (.pptx) into full-fledged web pages with **complete formatting preservation**:

### Perfect For

- 📱 Converting presentations to landing pages
- 🎨 Design mockups to HTML/CSS
- 📊 Web-based slide decks
- ⚡ Rapid prototyping

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Convert Presentation

```bash
python pptx_to_html.py "your_presentation.pptx" output_folder
```

### 3. View Results

Open `output_folder/index.html` in your browser to see the list of pages, or navigate directly to individual pages in `output_folder/pages/`.

---

## 📦 Output Structure

```
output_folder/
├── index.html          # Main page with list of all slides
├── style.css           # Common CSS for all pages
├── metadata.json       # Presentation metadata
├── pages/
│   ├── page1.html      # Slide 1
│   ├── page2.html      # Slide 2
│   └── ...
└── images/
    ├── img1.png
    ├── img2.jpg
    └── ...
```

---

## ✨ Features

### Complete Style Preservation (v16+)

- ✅ **Gradients** - Linear and radial gradients with multiple stops
- ✅ **Shadows** - Box shadows with blur and offset
- ✅ **Borders** - Various border styles and widths
- ✅ **Transformations** - Rotations and flips
- ✅ **Transparency** - PNG images with alpha channel

### Smart Image Classification (v15+)

- 🔍 **QR Codes** - Detected and rendered with pixel-perfect clarity
- 🎯 **Icons** - Centered with proportional scaling
- 🏢 **Logos** - Preserved aspect ratio
- 📊 **Diagrams** - Readable at any size

### Responsive Design

- 📱 Mobile-friendly layout
- 🖥️ Desktop-optimized viewing
- ⌨️ Keyboard navigation (Arrow keys, Escape)
- 🔍 Fullscreen mode (F11)

---

## 🛠️ Command Line Options

```bash
python pptx_to_html.py <pptx_file> [output_folder]
```

### Arguments

- `pptx_file` - Path to your PowerPoint file (required)
- `output_folder` - Output directory (default: `pptx_output`)

### Examples

```bash
# Basic conversion
python pptx_to_html.py "presentation.pptx"

# Custom output folder
python pptx_to_html.py "presentation.pptx" my_output

# With quotes for paths with spaces
python pptx_to_html.py "My Presentation.pptx" "My Output"
```

---

## 📋 Requirements

- Python 3.8+
- python-pptx
- Pillow (PIL)
- numpy

See `requirements.txt` for complete list.

---

## 🎨 What Gets Converted

### Text Elements
- ✅ Font family, size, color
- ✅ Bold, italic, underline
- ✅ Text alignment (left, center, right, justify)
- ✅ Line spacing
- ✅ Paragraph indentation

### Images
- ✅ PNG, JPG, GIF formats
- ✅ Transparency preservation
- ✅ Smart classification (QR, icon, logo, diagram)
- ✅ Exact positioning

### Shapes
- ✅ Rectangles, circles, polygons
- ✅ Fill colors and gradients
- ✅ Borders and shadows
- ✅ Rotation and transformations

### Tables
- ✅ Cell content
- ✅ Cell styling
- ✅ Border preservation

### Backgrounds
- ✅ Solid colors
- ✅ Background images
- ✅ Gradients

---

## 🔧 Advanced Features

### Image Classifier

The converter includes a smart image classifier that automatically detects:

- **QR Codes** - Renders at actual size with pixel-perfect clarity
- **Icons** - Centers and scales proportionally
- **Logos** - Preserves brand identity
- **Diagrams** - Maintains readability

### Style Extractor

Extracts advanced CSS properties:

- Gradients (linear, radial)
- Shadows (box-shadow)
- Borders (style, width, color)
- Transformations (rotate, flip)

---

## 📝 Navigation

### On Pages
- **← Назад / Вперед →** - Navigate between slides
- **📋 К списку** - Return to main index
- **Arrow Keys** - Previous/Next slide
- **Escape** - Return to index
- **F11** - Toggle fullscreen

### On Index Page
- **Click on card** - Go to specific slide
- **Number keys 1-9** - Quick jump to slides

---

## 🐛 Known Issues

- Some complex animations are not supported
- Advanced PowerPoint features (transitions, animations) are not converted
- Embedded videos require manual handling

---

## 📚 Documentation

For detailed documentation, see the `doc/` folder:

- `QUICKSTART.md` - Quick start guide
- `PPTX_CONVERTER_GUIDE.md` - Complete converter guide
- `PPTX_CHEATSHEET.md` - Quick reference

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [python-pptx](https://python-pptx.readthedocs.io/)
- Image processing with [Pillow](https://python-pillow.org/)

---

## 📧 Support

For issues and questions, please use the GitHub issue tracker.

---

**Made with ❤️ for web developers and designers**
