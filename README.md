# The Drop — Lecteur vinyle numérique

Application web (React + TypeScript + Vite) dédiée à l&apos;organisation et la lecture locale de fichiers `.mp3` dans une ambiance « liquid glass » inspirée de platines vinyles. Elle propose trois sections : bibliothèque, lecteur immersif et file d&apos;attente réordonnable.

## 🚀 Démarrage

```bash
npm install
npm run dev
```

L&apos;interface est accessible sur [http://localhost:5173](http://localhost:5173). Pour une build de production:

```bash
npm run build
npm run preview
```

## 🧪 Tests

La logique du store global (Zustand) est couverte par Vitest :

```bash
npm run test -- --run
```

## 🧱 Pile technique

- React 19 + Vite (TypeScript)
- Zustand (état global + persistance `localStorage`)
- Tailwind CSS (thème liquid glass) & Framer Motion (animations 3D/rotation)
- React Router (navigation dock bas)
- `music-metadata-browser` (lecture ID3) & Web Audio API/`<audio>` HTML5
- `@dnd-kit` (drag & drop de la file d&apos;attente)

## ✨ Fonctionnalités clés

- **Import local** : bouton + zone de drop, lecture des métadonnées (titre, artiste, album, pochette) et génération d&apos;URL locales.
- **Bibliothèque Albums** :
  - Carrousel 3D cover-flow (Framer Motion) avec focus contextuel.
  - Vue Grille responsive avec tri (Titre, Artiste, Année, Ajout) et filtrage instantané.
- **Lecteur vinyle** : plateau animé, bras réactif, contrôle lecture/seeking/volume, badge vitesse synchronisé, raccourcis clavier (space, ←, →).
- **File d&apos;attente** : cartes inclinées réordonnables, actions rapides (Play, Monter/Descendre, Supprimer), actions globales (Vider, Sauvegarder, Shuffle/Boucle).
- **Accessibilité** : focus visibles, ARIA basique, navigation clavier, commandes globales.
- **Persistance** : bibliothèque, file, volume, vue préférée mémorisés dans `localStorage` (fichiers requis pour relire les morceaux après rechargement).

## 🗂️ Organisation du code

```
src/
├─ audio/AudioProvider.tsx       # Gestion centralisée du tag <audio>
├─ components/
│  ├─ library/…                  # Header, carrousel 3D, grille, barre mini-info
│  ├─ player/…                   # Plateau vinyle, contrôles, infos piste
│  └─ queue/…                    # File d'attente drag & drop
├─ pages/                        # LibraryPage, PlayerPage, QueuePage
├─ store/useMusicStore.ts        # Zustand (library/player/queue/ui)
├─ utils/                        # Format helpers & parsing métadonnées
└─ test/setup.ts                 # Configuration Vitest + RTL
```

## 📌 Notes

- Les URLs `URL.createObjectURL` sont invalidées lors de la suppression d&apos;une piste.
- La persistance stocke les métadonnées (sans l&apos;objet `File`) : après rechargement, réimportez les morceaux pour récupérer la lecture.
- Les visuels utilisent la police Inter chargée via Google Fonts.
- L&apos;analyse ID3 est chargée à la demande pour conserver des bundles < 500 kB.

Bon mix 🎧
