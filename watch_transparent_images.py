import os
import sys
import time
from PIL import Image

ASSET_DIRS = [
    'minijuegos/public/assets/images',
    'minijuegos/public/assets/images/targetas',
    'minijuegos/public/assets/logos'
]

SRC_DIR = 'minijuegos/src'
INDEX_HTML = 'minijuegos/index.html'

def is_transparent_png(file_path):
    try:
        with Image.open(file_path) as im:
            rgba = im.convert('RGBA')
            alpha = rgba.split()[-1]
            extrema = alpha.getextrema()
            # If minimum alpha is 0 or less than 200, check percentage
            if extrema[0] < 200:
                w, h = im.size
                total = w * h
                trans_count = sum(1 for a in alpha.getdata() if a < 128)
                pct = (trans_count / total) * 100
                if pct > 2.0:
                    return True
                # Check corners
                corners = [
                    rgba.getpixel((0, 0))[3],
                    rgba.getpixel((w - 1, 0))[3],
                    rgba.getpixel((0, h - 1))[3],
                    rgba.getpixel((w - 1, h - 1))[3]
                ]
                if any(c < 128 for c in corners):
                    return True
    except Exception as e:
        pass
    return False

def update_code_references(base_name):
    # Search and replace in src and index.html
    files_to_check = []
    if os.path.exists(SRC_DIR):
        for root, _, files in os.walk(SRC_DIR):
            for f in files:
                if f.endswith(('.ts', '.tsx', '.js', '.css', '.html')):
                    files_to_check.append(os.path.join(root, f))
    if os.path.exists(INDEX_HTML):
        files_to_check.append(INDEX_HTML)

    png_ref = f'{base_name}.png'
    webp_ref = f'{base_name}.webp'

    updated_count = 0
    for file_path in files_to_check:
        try:
            with open(file_path, 'r', encoding='utf-8') as fp:
                content = fp.read()
            if png_ref in content:
                new_content = content.replace(png_ref, webp_ref)
                with open(file_path, 'w', encoding='utf-8') as fp:
                    fp.write(new_content)
                updated_count += 1
                print(f'   -> Referencia actualizada en: {file_path}')
        except Exception as e:
            print(f'   [!] Error actualizando {file_path}: {e}')
    return updated_count

def process_image(dir_path, filename):
    base_name, ext = os.path.splitext(filename)
    png_path = os.path.join(dir_path, filename)
    webp_path = os.path.join(dir_path, f'{base_name}.webp')

    print(f'\n[DETECTADO] Nueva imagen sin fondo: {png_path}')
    try:
        # Convert to lossless webp
        with Image.open(png_path) as im:
            rgba = im.convert('RGBA')
            rgba.save(webp_path, 'WEBP', lossless=True)
        print(f'   [OK] Convertido a {webp_path}')

        # Update code
        update_code_references(base_name)

        # Delete original PNG
        os.remove(png_path)
        print(f'   [OK] Eliminado archivo original {png_path}')
        return True
    except Exception as e:
        print(f'   [ERROR] Fallo al procesar {png_path}: {e}')
        return False

def scan_once():
    processed = 0
    for d in ASSET_DIRS:
        if not os.path.exists(d):
            continue
        for f in sorted(os.listdir(d)):
            if f.lower().endswith('.png'):
                fp = os.path.join(d, f)
                if os.path.isfile(fp):
                    if is_transparent_png(fp):
                        if process_image(d, f):
                            processed += 1
    return processed

def watch_loop(poll_interval=2):
    print(f'=== WATCHER DE IMAGENES INICIADO ===')
    print(f'Monitorizando carpetas:')
    for d in ASSET_DIRS:
        print(f' - {d}')
    print('Esperando nuevas fotos sin fondo... Presiona Ctrl+C para detener.\n')

    # Initial scan
    initial_count = scan_once()
    if initial_count > 0:
        print(f'\n[INICIO] Se procesaron {initial_count} imagenes existentes.')

    while True:
        try:
            scan_once()
            time.sleep(poll_interval)
        except KeyboardInterrupt:
            print('\nWatcher detenido por el usuario.')
            break
        except Exception as e:
            print(f'Error en ciclo de monitoreo: {e}')
            time.sleep(poll_interval)

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--once':
        count = scan_once()
        print(f'Escaneo unico finalizado. Procesadas: {count}')
    else:
        watch_loop()
