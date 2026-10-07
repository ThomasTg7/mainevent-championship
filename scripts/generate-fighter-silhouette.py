"""Genera la silueta de un peleador en guardia: volúmenes -> masa suave -> contorno -> path SVG (viewBox 400x600).

Uso (Python 3 con numpy, Pillow y scipy): python scripts/generate-fighter-silhouette.py salida.txt
y pegar el contenido en el `d` de `src/features/fighters/components/fighter-silhouette.tsx`.
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

K = 4  # resolución de trabajo: 1600x2400
W, H = 400, 660


def P(x, y):
    return (x * K, y * K)


img = Image.new("L", (W * K, H * K), 0)
d = ImageDraw.Draw(img)


def ellipse(cx, cy, rx, ry, angle=0):
    pts = []
    a = math.radians(angle)
    for i in range(72):
        t = 2 * math.pi * i / 72
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append(P(cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    d.polygon(pts, fill=255)


def capsule(x1, y1, x2, y2, w1, w2=None):
    """Segmento con extremos redondos y grosor que va de w1 a w2 (un miembro que se afina)."""
    w2 = w1 if w2 is None else w2
    steps = 40
    for i in range(steps + 1):
        t = i / steps
        x, y, w = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, w1 + (w2 - w1) * t
        ellipse(x, y, w / 2, w / 2)


def poly(*pts):
    d.polygon([P(x, y) for x, y in pts], fill=255)


# Cabeza (3/4, mentón abajo), mandíbula, oreja
ellipse(226, 110, 38, 47, -6)
poly((196, 126), (260, 120), (254, 158), (234, 180), (212, 182), (198, 164))
ellipse(193, 122, 8, 14)
# Cuello ancho y trapecios
poly((200, 144), (248, 142), (262, 210), (182, 212))
poly((190, 194), (118, 230), (106, 262), (200, 240))
poly((250, 190), (316, 224), (326, 254), (246, 236))
# Torso en V: pecho ancho, dorsales, cintura más angosta; baja más allá del borde (se recorta recto)
poly((112, 248), (326, 236), (334, 300), (318, 380), (298, 450), (286, 540), (284, 660), (148, 660), (146, 540), (134, 450), (112, 380), (100, 300))
ellipse(170, 286, 54, 40, 8)
ellipse(262, 280, 52, 38, -8)
# Brazo trasero (izquierda): deltoides, brazo pegado, antebrazo arriba y guante junto a la mejilla (asoma al lado de la cara)
ellipse(118, 272, 48, 56, 10)
capsule(112, 292, 104, 384, 68, 58)
capsule(104, 386, 158, 236, 56, 44)
ellipse(164, 184, 36, 46, -24)
poly((136, 150), (186, 140), (196, 176), (140, 190))  # nudillos: el guante es más cuadrado arriba
ellipse(192, 204, 11, 17, -30)  # pulgar
capsule(160, 228, 164, 220, 46)
# Brazo delantero (derecha): deltoides, codo afuera, guante adelante a la altura de los ojos
ellipse(308, 262, 46, 52, -12)
capsule(320, 280, 360, 352, 62, 54)
capsule(362, 354, 352, 244, 52, 44)
ellipse(354, 196, 38, 48, 14)
poly((328, 160), (378, 150), (392, 188), (334, 196))  # nudillos
ellipse(326, 214, 11, 17, 25)  # pulgar
capsule(352, 240, 353, 232, 46)

arr = np.asarray(img, dtype=np.float32) / 255.0
soft = ndimage.gaussian_filter(arr, sigma=3.2 * K)
mask = ndimage.binary_fill_holes(soft > 0.5)
mask[-2:, :] = False  # el borde inferior se cierra fuera del viewBox (600): se ve recto

# --- Contorno: trazado de Moore sobre la máscara (borde exterior y huecos) ---
DIRS = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]  # (dx, dy) en sentido horario


def trace(m, start):
    """Borde de la región que contiene `start` (primer píxel en el barrido), recorrido con vecindad de Moore."""
    hh, ww = m.shape
    inside = lambda x, y: 0 <= x < ww and 0 <= y < hh and m[y, x]
    pts = [start]
    cur, back = start, 4  # se entra desde el oeste
    for _ in range(200000):
        found = False
        for k in range(8):
            dirn = (back + 1 + k) % 8
            nx, ny = cur[0] + DIRS[dirn][0], cur[1] + DIRS[dirn][1]
            if inside(nx, ny):
                back = (dirn + 4) % 8
                cur = (nx, ny)
                found = True
                break
        if not found or cur == start:
            break
        pts.append(cur)
    return pts


loops = []
ys, xs = np.nonzero(mask)
first = (int(xs[np.argmin(ys * 100000 + xs)]), int(ys.min()))
loops.append(trace(mask, first))
# Huecos: zonas de fondo encerradas por la figura
labels, count = ndimage.label(~mask)
for lab in range(1, count + 1):
    region = labels == lab
    if region[0, :].any() or region[-1, :].any() or region[:, 0].any() or region[:, -1].any():
        continue
    if region.sum() < (24 * K) ** 2:  # un hueco chico (entre guante y cuello) se rellena
        continue
    ys, xs = np.nonzero(region)
    loops.append(trace(region, (int(xs[np.argmin(ys * 100000 + xs)]), int(ys.min()))))


def rdp(points, eps):
    if len(points) < 3:
        return points
    a, b = np.array(points[0]), np.array(points[-1])
    ab = b - a
    norm = np.hypot(*ab) or 1.0
    dists = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / norm for p in points[1:-1]]
    i = int(np.argmax(dists)) + 1
    if dists[i - 1] > eps:
        return rdp(points[: i + 1], eps)[:-1] + rdp(points[i:], eps)
    return [points[0], points[-1]]


def to_path(loop):
    half = len(loop) // 2
    pts = rdp(loop[: half + 1], 1.2 * K)[:-1] + rdp(loop[half:] + [loop[0]], 1.2 * K)[:-1]
    pts = [(x / K, y / K) for x, y in pts]
    n = len(pts)
    out = [f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"]
    # Catmull-Rom -> Bézier cúbicas: curvas suaves que pasan por los puntos
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    return "".join(out) + "Z"


paths = " ".join(to_path(loop) for loop in loops)
open(sys.argv[1], "w").write(paths)
print(len(loops), "lazos,", len(paths), "caracteres")
