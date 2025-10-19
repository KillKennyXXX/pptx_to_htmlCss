#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Модуль извлечения продвинутых стилей из PPTX (v16)
Поддержка градиентов, теней, эффектов, трансформаций
"""

from pptx.enum.dml import MSO_FILL_TYPE, MSO_LINE_DASH_STYLE
from pptx.dml.color import RGBColor


class StyleExtractor:
    """Извлечение продвинутых стилей из PPTX"""
    
    @staticmethod
    def emu_to_px(emu):
        """Конвертирует EMU в пиксели"""
        return emu // 9525 if emu else 0
    
    @staticmethod
    def rgb_to_hex(rgb_color):
        """Конвертирует RGBColor в hex"""
        try:
            if hasattr(rgb_color, 'rgb'):
                rgb = rgb_color.rgb
                return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
        except:
            pass
        return None
    
    def extract_fill_style(self, fill):
        """
        Полное извлечение стилей заливки
        Поддерживает: SOLID, GRADIENT, PICTURE
        """
        styles = {}
        
        try:
            fill_type = fill.type
            
            if fill_type == MSO_FILL_TYPE.SOLID:
                # Сплошная заливка
                styles.update(self.extract_solid_fill(fill))
            
            elif fill_type == MSO_FILL_TYPE.GRADIENT:
                # Градиент
                styles.update(self.extract_gradient_fill(fill))
            
            elif fill_type == MSO_FILL_TYPE.PICTURE:
                # Изображение (обрабатывается отдельно)
                styles['fill_type'] = 'picture'
            
            elif fill_type == MSO_FILL_TYPE.BACKGROUND:
                # Фон из макета
                styles['fill_type'] = 'background'
                
        except Exception as e:
            # Тихо игнорируем ошибки
            pass
        
        return styles
    
    def extract_solid_fill(self, fill):
        """Извлекает сплошную заливку"""
        styles = {}
        
        try:
            color = self.rgb_to_hex(fill.fore_color)
            if color:
                styles['background-color'] = color
            
            # Прозрачность
            try:
                if hasattr(fill.fore_color, 'transparency'):
                    transparency = fill.fore_color.transparency
                    if transparency is not None and transparency > 0:
                        opacity = 1.0 - transparency
                        styles['opacity'] = f"{opacity:.2f}"
            except:
                pass
                
        except Exception as e:
            pass
        
        return styles
    
    def extract_gradient_fill(self, fill):
        """
        Извлекает градиент
        Возвращает CSS linear-gradient или radial-gradient
        """
        styles = {}
        
        try:
            # Доступ к XML элементам для градиента
            elem = fill._element
            grad_fill = elem.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}gradFill')
            
            if grad_fill is None:
                return styles
            
            # Собираем остановки (color stops)
            stops = []
            gs_list = grad_fill.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}gs')
            
            for gs in gs_list:
                # Позиция остановки (0-100%)
                pos = int(gs.get('pos', 0)) / 1000  # Из промилей в проценты
                
                # Цвет остановки
                color_elem = gs.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}srgbClr')
                if color_elem is not None:
                    color_val = color_elem.get('val', '000000')
                    color = f"#{color_val}"
                else:
                    # Попробуем schemeClr или другие
                    scheme_clr = gs.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}schemeClr')
                    if scheme_clr is not None:
                        # Для простоты используем серый
                        color = "#808080"
                    else:
                        color = "#000000"
                
                stops.append((pos, color))
            
            # Сортируем по позиции
            stops.sort(key=lambda x: x[0])
            
            # Определяем тип градиента
            lin = grad_fill.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}lin')
            path = grad_fill.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}path')
            
            if lin is not None:
                # Линейный градиент
                angle = int(lin.get('ang', 0)) / 60000  # Из 1/60000 градуса в градусы
                
                # Конвертируем угол из PowerPoint (0° = вправо, по часовой) 
                # в CSS (0° = вверх, по часовой)
                css_angle = (angle + 90) % 360
                
                # Формируем CSS
                stop_strs = [f"{color} {pos:.1f}%" for pos, color in stops]
                gradient = f"linear-gradient({css_angle}deg, {', '.join(stop_strs)})"
                
                styles['background'] = gradient
                print(f"         ✨ Градиент LINEAR {css_angle}° с {len(stops)} остановками")
            
            elif path is not None:
                # Радиальный или path градиент
                path_type = path.get('path', 'shape')
                
                if path_type == 'circle':
                    # Радиальный градиент
                    stop_strs = [f"{color} {pos:.1f}%" for pos, color in stops]
                    gradient = f"radial-gradient(circle, {', '.join(stop_strs)})"
                    
                    styles['background'] = gradient
                    print(f"         ✨ Градиент RADIAL с {len(stops)} остановками")
                else:
                    # Path/shape - используем radial как approximation
                    stop_strs = [f"{color} {pos:.1f}%" for pos, color in stops]
                    gradient = f"radial-gradient(ellipse, {', '.join(stop_strs)})"
                    
                    styles['background'] = gradient
                    print(f"         ✨ Градиент PATH/SHAPE с {len(stops)} остановками")
            
            else:
                # Fallback: простой линейный градиент
                if stops:
                    stop_strs = [f"{color} {pos:.1f}%" for pos, color in stops]
                    gradient = f"linear-gradient(180deg, {', '.join(stop_strs)})"
                    styles['background'] = gradient
                    print(f"         ✨ Градиент FALLBACK с {len(stops)} остановками")
        
        except Exception as e:
            print(f"         ⚠️ Ошибка извлечения градиента: {e}")
        
        return styles
    
    def extract_line_style(self, line):
        """
        Полное извлечение стилей линии/границы
        Поддерживает: толщину, цвет, стиль (solid, dashed, dotted)
        
        ВАЖНО: Границы добавляются ТОЛЬКО если:
        1. line.fill.type != None (граница включена)
        2. line.width > 0 (толщина больше 0)
        """
        styles = {}
        
        try:
            if not line:
                return styles
            
            # Проверяем, что граница вообще включена
            if not hasattr(line, 'fill') or line.fill is None:
                return styles
            
            fill_type = line.fill.type
            
            # Если fill.type is None или 0 (нет заливки) - границы нет
            if fill_type is None or fill_type == 0:
                return styles
            
            # Толщина
            if not hasattr(line, 'width') or not line.width:
                return styles
            
            width_px = self.emu_to_px(line.width)
            
            # Если толщина меньше 1px - игнорируем границу
            if width_px < 1:
                return styles
            
            styles['border-width'] = f"{width_px}px"
            
            # Цвет
            try:
                if hasattr(line.fill, 'fore_color') and line.fill.fore_color:
                    color = self.rgb_to_hex(line.fill.fore_color)
                    if color:
                        styles['border-color'] = color
            except:
                pass
            
            # Стиль линии
            if hasattr(line, 'dash_style'):
                dash = line.dash_style
                
                if dash == MSO_LINE_DASH_STYLE.SOLID or dash is None:
                    styles['border-style'] = 'solid'
                elif dash == MSO_LINE_DASH_STYLE.DASH:
                    styles['border-style'] = 'dashed'
                    print(f"         📏 Граница: DASHED {width_px}px")
                elif dash == MSO_LINE_DASH_STYLE.DOT:
                    styles['border-style'] = 'dotted'
                    print(f"         📏 Граница: DOTTED {width_px}px")
                elif dash == MSO_LINE_DASH_STYLE.DASH_DOT:
                    # CSS не поддерживает dash-dot, используем dashed
                    styles['border-style'] = 'dashed'
                    print(f"         📏 Граница: DASH-DOT {width_px}px")
                elif dash == MSO_LINE_DASH_STYLE.LONG_DASH:
                    styles['border-style'] = 'dashed'
                    print(f"         📏 Граница: LONG-DASH {width_px}px")
                else:
                    styles['border-style'] = 'solid'
            else:
                # По умолчанию solid
                styles['border-style'] = 'solid'
            
            # Если граница валидна - выводим информацию
            if styles:
                print(f"         📏 Граница: {styles.get('border-style', 'solid')} {width_px}px {styles.get('border-color', '')}")
                
        except Exception as e:
            pass
        
        return styles
    
    def extract_shadow_effect(self, shape):
        """
        Извлекает эффект тени
        Возвращает CSS box-shadow
        
        ВАЖНО: Тень добавляется ТОЛЬКО если есть реальные параметры
        """
        styles = {}
        
        try:
            elem = shape._element
            sp_pr = elem.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}spPr')
            
            if sp_pr is None:
                return styles
            
            effect_lst = sp_pr.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}effectLst')
            if effect_lst is None:
                return styles
            
            # Внешняя тень
            outer_shdw = effect_lst.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}outerShdw')
            if outer_shdw is None:
                return styles
            
            # Параметры тени
            blur_emu = int(outer_shdw.get('blurRad', 0))
            dist_emu = int(outer_shdw.get('dist', 0))
            dir_angle = int(outer_shdw.get('dir', 0)) / 60000  # В градусы
            
            blur = blur_emu // 9525
            dist = dist_emu // 9525
            
            # Если размытие и расстояние нулевые - тень отсутствует
            if blur == 0 and dist == 0:
                return styles
            
            # Вычисляем смещение по x и y
            import math
            # PowerPoint: 0° = вправо, по часовой
            # CSS: нужны offset-x и offset-y
            angle_rad = math.radians(dir_angle)
            offset_x = int(dist * math.cos(angle_rad))
            offset_y = int(dist * math.sin(angle_rad))
            
            # Цвет тени
            color_elem = outer_shdw.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}srgbClr')
            if color_elem is not None:
                color_val = color_elem.get('val', '000000')
                color = f"#{color_val}"
                
                # Проверяем прозрачность
                alpha_elem = color_elem.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}alpha')
                if alpha_elem is not None:
                    alpha_val = int(alpha_elem.get('val', 100000)) / 100000
                    if alpha_val < 0.1:  # Почти прозрачная тень - игнорируем
                        return styles
            else:
                # Попробуем другие типы цвета
                scheme_clr = outer_shdw.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}schemeClr')
                if scheme_clr is not None:
                    # Для простоты используем темно-серый
                    color = "#333333"
                else:
                    color = "#000000"
            
            # Формируем box-shadow
            shadow = f"{offset_x}px {offset_y}px {blur}px {color}"
            styles['box-shadow'] = shadow
            print(f"         🌑 Тень: offset=({offset_x},{offset_y}) blur={blur}px color={color}")
        
        except Exception as e:
            pass
        
        return styles
    
    def extract_transform_style(self, shape):
        """
        Полное извлечение трансформаций
        Поддерживает: rotation, flip horizontal/vertical
        """
        styles = {}
        transforms = []
        
        try:
            # Поворот
            if hasattr(shape, 'rotation') and shape.rotation != 0:
                transforms.append(f"rotate({shape.rotation}deg)")
                print(f"         🔄 Поворот: {shape.rotation}°")
            
            # Отражение (через XML)
            elem = shape._element
            xfrm = elem.find('.//{http://schemas.openxmlformats.org/presentationml/2006/main}xfrm')
            
            if xfrm is None:
                # Попробуем другой путь для групп и других типов
                xfrm = elem.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}xfrm')
            
            if xfrm is not None:
                flip_h = xfrm.get('flipH')
                flip_v = xfrm.get('flipV')
                
                if flip_h == '1':
                    transforms.append("scaleX(-1)")
                    print(f"         ↔️ Отражение: горизонтальное")
                
                if flip_v == '1':
                    transforms.append("scaleY(-1)")
                    print(f"         ↕️ Отражение: вертикальное")
            
            # Применяем трансформации
            if transforms:
                styles['transform'] = ' '.join(transforms)
                styles['transform-origin'] = 'center center'
        
        except Exception as e:
            pass
        
        return styles


# Singleton instance
style_extractor = StyleExtractor()
