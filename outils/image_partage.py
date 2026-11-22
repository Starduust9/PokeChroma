"""Crée l'image d'aperçu des liens (1200 x 630) : assets/picture/partage.png.
À relancer seulement si le logo change :  python outils/image_partage.py"""
import os

import cv2
import numpy as np

ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ICI)
W, H = 1200, 630


def lire(chemin):
    return cv2.imdecode(np.fromfile(chemin, np.uint8), cv2.IMREAD_UNCHANGED)


def coller(fond, img, x, y):
    h, w = img.shape[:2]
    if img.shape[2] == 4:
        a = img[:, :, 3:4].astype(np.float32) / 255
        fond[y:y + h, x:x + w] = (img[:, :, :3] * a + fond[y:y + h, x:x + w] * (1 - a)).astype(np.uint8)
    else:
        fond[y:y + h, x:x + w] = img[:, :, :3]


# fond : dégradé bleu nuit du site, avec un halo plus clair au centre
yy, xx = np.mgrid[0:H, 0:W]
halo = np.exp(-(((xx - W / 2) / 520) ** 2 + ((yy - H / 2) / 300) ** 2))
fond = np.zeros((H, W, 3), np.float32)
for c, (a, b) in enumerate(((0x2a, 0x1e), (0x1a, 0x13), (0x16, 0x11))):   # B, G, R (bleu nuit du site)
    fond[:, :, c] = a + (b - a) * (yy / H)
fond += halo[..., None] * np.array([70, 45, 25], np.float32)        # halo bleu
fond = fond.clip(0, 255).astype(np.uint8)

titre = lire("assets/picture/Pok-Chroma-14-04-2025.png")
f = min(1000 / titre.shape[1], 330 / titre.shape[0])
titre = cv2.resize(titre, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
coller(fond, titre, (W - titre.shape[1]) // 2, (H - titre.shape[0]) // 2 - 20)

mascotte = lire("assets/picture/Logo.png")
f = 150 / mascotte.shape[0]
mascotte = cv2.resize(mascotte, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
if mascotte.ndim == 2 or mascotte.shape[2] == 3:
    mascotte = cv2.cvtColor(mascotte, cv2.COLOR_BGR2BGRA)
coller(fond, mascotte, 40, H - mascotte.shape[0] - 30)

cv2.imencode(".png", fond)[1].tofile("assets/picture/partage.png")
print("assets/picture/partage.png", fond.shape)
