#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Классификатор изображений для парсера PPTX
Различает QR-коды, иконки, логотипы, фотографии и диаграммы
"""

from PIL import Image, ImageStat
import numpy as np
from typing import Tuple, Dict, Literal

ImageType = Literal['qr-code', 'icon', 'logo', 'photo', 'diagram', 'unknown']


class ImageClassifier:
    """Классифицирует изображения по типу"""
    
    # Пороги для классификации
    QR_CODE_MAX_SIZE = 100  # Максимальный размер QR-кода
    QR_CODE_MIN_SIZE = 20   # Минимальный размер QR-кода
    QR_CODE_ASPECT_RATIO_MIN = 0.85  # QR-коды почти квадратные
    QR_CODE_ASPECT_RATIO_MAX = 1.15
    QR_CODE_CONTRAST_THRESHOLD = 0.6  # Минимальная контрастность
    
    ICON_MAX_SIZE = 150
    LOGO_MAX_SIZE = 400
    
    def __init__(self):
        pass
    
    def classify(self, image_path: str, position: Tuple[float, float], 
                 size_in_pptx: Tuple[int, int]) -> Dict:
        """
        Классифицирует изображение
        
        Args:
            image_path: Путь к файлу изображения
            position: Позиция на слайде (left_percent, top_percent)
            size_in_pptx: Размер в PPTX (width_px, height_px)
            
        Returns:
            Dict с результатами:
            {
                'type': ImageType,
                'confidence': float (0-1),
                'actual_size': (width, height),
                'reason': str
            }
        """
        
        try:
            with Image.open(image_path) as img:
                actual_w, actual_h = img.size
                
                # Проверяем на QR-код
                if self.is_qr_code(img, actual_w, actual_h):
                    return {
                        'type': 'qr-code',
                        'confidence': 0.9,
                        'actual_size': (actual_w, actual_h),
                        'reason': 'Маленький, квадратный, высококонтрастный'
                    }
                
                # Проверяем на иконку
                if self.is_icon(img, actual_w, actual_h, position):
                    return {
                        'type': 'icon',
                        'confidence': 0.8,
                        'actual_size': (actual_w, actual_h),
                        'reason': 'Маленький размер, простая графика'
                    }
                
                # Проверяем на логотип
                if self.is_logo(img, actual_w, actual_h, position):
                    return {
                        'type': 'logo',
                        'confidence': 0.7,
                        'actual_size': (actual_w, actual_h),
                        'reason': 'Средний размер, позиция углу/сверху/снизу'
                    }
                
                # Проверяем на диаграмму
                if self.is_diagram(img, actual_w, actual_h):
                    return {
                        'type': 'diagram',
                        'confidence': 0.6,
                        'actual_size': (actual_w, actual_h),
                        'reason': 'Большая, возможно содержит графики'
                    }
                
                # По умолчанию - фото
                return {
                    'type': 'photo',
                    'confidence': 0.5,
                    'actual_size': (actual_w, actual_h),
                    'reason': 'Большое изображение, фотографическое содержимое'
                }
                
        except Exception as e:
            return {
                'type': 'unknown',
                'confidence': 0.0,
                'actual_size': (0, 0),
                'reason': f'Ошибка анализа: {str(e)}'
            }
    
    def is_qr_code(self, img: Image.Image, width: int, height: int) -> bool:
        """
        Определяет, является ли изображение QR-кодом
        
        Критерии:
        1. Размер: 20-100px (маленький)
        2. Соотношение сторон: ~1:1 (квадратный ±15%)
        3. Контрастность: высокая (чёрно-белый)
        """
        
        # Критерий 1: Размер
        if not (self.QR_CODE_MIN_SIZE <= width <= self.QR_CODE_MAX_SIZE and
                self.QR_CODE_MIN_SIZE <= height <= self.QR_CODE_MAX_SIZE):
            return False
        
        # Критерий 2: Соотношение сторон (квадратный)
        aspect_ratio = width / height
        if not (self.QR_CODE_ASPECT_RATIO_MIN <= aspect_ratio <= self.QR_CODE_ASPECT_RATIO_MAX):
            return False
        
        # Критерий 3: Контрастность (чёрно-белый)
        contrast = self._calculate_contrast(img)
        if contrast < self.QR_CODE_CONTRAST_THRESHOLD:
            return False
        
        return True
    
    def is_icon(self, img: Image.Image, width: int, height: int, 
                position: Tuple[float, float]) -> bool:
        """
        Определяет, является ли изображение иконкой
        
        Критерии:
        1. Размер: < 150px
        2. Не квадратное (иначе было бы QR-кодом)
        3. Позиция: в тексте или рядом с текстом
        """
        
        # Критерий 1: Размер
        if width > self.ICON_MAX_SIZE or height > self.ICON_MAX_SIZE:
            return False
        
        # Критерий 2: Не квадратное (или не высококонтрастное)
        aspect_ratio = width / height
        if (self.QR_CODE_ASPECT_RATIO_MIN <= aspect_ratio <= self.QR_CODE_ASPECT_RATIO_MAX):
            # Квадратное, проверяем контраст
            contrast = self._calculate_contrast(img)
            if contrast >= self.QR_CODE_CONTRAST_THRESHOLD:
                return False  # Это скорее QR-код
        
        return True
    
    def is_logo(self, img: Image.Image, width: int, height: int,
                position: Tuple[float, float]) -> bool:
        """
        Определяет, является ли изображение логотипом
        
        Критерии:
        1. Размер: 150-400px (средний)
        2. Позиция: в углу слайда или сверху/снизу
        """
        
        # Критерий 1: Размер
        if not (self.ICON_MAX_SIZE < max(width, height) <= self.LOGO_MAX_SIZE):
            return False
        
        # Критерий 2: Позиция (углы или верх/низ)
        left_percent, top_percent = position
        
        # Верхний левый угол
        if left_percent < 20 and top_percent < 20:
            return True
        
        # Верхний правый угол
        if left_percent > 80 and top_percent < 20:
            return True
        
        # Нижний левый угол
        if left_percent < 20 and top_percent > 80:
            return True
        
        # Нижний правый угол
        if left_percent > 80 and top_percent > 80:
            return True
        
        # Снизу по центру
        if 40 < left_percent < 60 and top_percent > 85:
            return True
        
        return False
    
    def is_diagram(self, img: Image.Image, width: int, height: int) -> bool:
        """
        Определяет, является ли изображение диаграммой
        
        Критерии:
        1. Размер: > 400px (большая)
        2. Цветовое разнообразие: несколько цветов (графики часто цветные)
        """
        
        # Критерий 1: Размер
        if max(width, height) <= self.LOGO_MAX_SIZE:
            return False
        
        # Критерий 2: Цветовое разнообразие
        color_diversity = self._calculate_color_diversity(img)
        if color_diversity > 0.3:  # Много разных цветов
            return True
        
        return False
    
    def _calculate_contrast(self, img: Image.Image) -> float:
        """
        Вычисляет контрастность изображения (0-1)
        Высокая контрастность = много чёрных и белых пикселей
        """
        
        # Конвертируем в градации серого
        grayscale = img.convert('L')
        
        # Получаем гистограмму
        histogram = grayscale.histogram()
        
        # Считаем чёрные пиксели (0-50)
        black_pixels = sum(histogram[:50])
        
        # Считаем белые пиксели (205-255)
        white_pixels = sum(histogram[205:])
        
        # Общее количество пикселей
        total_pixels = sum(histogram)
        
        # Доля чёрно-белых пикселей
        contrast_ratio = (black_pixels + white_pixels) / total_pixels
        
        return contrast_ratio
    
    def _calculate_color_diversity(self, img: Image.Image) -> float:
        """
        Вычисляет цветовое разнообразие изображения (0-1)
        Высокое разнообразие = много разных цветов
        """
        
        # Уменьшаем изображение для ускорения
        img_small = img.resize((50, 50))
        
        # Конвертируем в RGB
        if img_small.mode != 'RGB':
            img_small = img_small.convert('RGB')
        
        # Получаем все уникальные цвета
        colors = img_small.getcolors(maxcolors=50*50)
        
        if not colors:
            return 0.0
        
        # Количество уникальных цветов / общее количество пикселей
        unique_colors = len(colors)
        total_pixels = 50 * 50
        
        diversity = unique_colors / total_pixels
        
        return diversity


def test_classifier():
    """Тестирует классификатор на реальных изображениях"""
    import os
    import sys
    
    print("\n" + "="*80)
    print("ТЕСТ КЛАССИФИКАТОРА ИЗОБРАЖЕНИЙ")
    print("="*80 + "\n")
    
    classifier = ImageClassifier()
    
    # Путь к изображениям
    images_dir = "neo_output_v14/images"
    
    if not os.path.exists(images_dir):
        print(f"❌ Директория не найдена: {images_dir}")
        return
    
    # Получаем список всех изображений
    image_files = [f for f in os.listdir(images_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    print(f"Найдено изображений: {len(image_files)}\n")
    
    # Классифицируем каждое изображение
    results = {
        'qr-code': [],
        'icon': [],
        'logo': [],
        'photo': [],
        'diagram': [],
        'unknown': []
    }
    
    for img_file in sorted(image_files)[:20]:  # Первые 20 для теста
        img_path = os.path.join(images_dir, img_file)
        
        # Для теста используем позицию (50, 50) - центр
        result = classifier.classify(img_path, (50.0, 50.0), (100, 100))
        
        img_type = result['type']
        results[img_type].append(img_file)
        
        print(f"📷 {img_file:30s} → {img_type:10s} ({result['confidence']:.1%}) "
              f"{result['actual_size'][0]}x{result['actual_size'][1]}px - {result['reason']}")
    
    # Итоговая статистика
    print(f"\n{'─'*80}\n")
    print("📊 ИТОГИ КЛАССИФИКАЦИИ:\n")
    for img_type, files in results.items():
        if files:
            print(f"   {img_type:10s}: {len(files):2d} изображений")
    
    print(f"\n{'='*80}\n")


if __name__ == "__main__":
    test_classifier()
