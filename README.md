# Gourmet AR Menu

A stunning, lightweight, and interactive web application that allows users to view high-quality 3D food models (Gaussian Splats) natively in the browser, complete with an immersive Augmented Reality (WebXR) experience.

![Menu Preview](./assets/menu-preview.jpg) <!-- Replace with an actual screenshot -->

## ✨ Features

- **Modern Glassmorphism UI**: A sleek, responsive, and tactile menu interface.
- **Gaussian Splat 3D Rendering**: Ultra-realistic 3D rendering without massive polygon counts using `@mkkellogg/gaussian-splats-3d`.
- **WebXR AR Integration**: Seamlessly drop dishes onto real-world tables using surface hit-testing.
- **Dynamic Content**: Data is driven entirely by a clean `dishes.json` file.
- **No Build Tools Required**: Runs purely via ES Modules with `<script type="importmap">`, ensuring ultra-fast local development and instant deployment.
- **Interactive Raycasting**: Tap on the AR dishes in 3D space to toggle a contextual glassmorphic information panel overlay.

## 🚀 Getting Started

Since this project utilizes ES modules and fetches local JSON dependencies, it must be run on a local development server (opening the HTML file directly via `file://` will trigger CORS errors in modern browsers).

### Prerequisites

You can use any local HTTP server. Some simple options include:

- **VS Code Live Server Extension** (Recommended)
- **Node.js**: `npx serve .` or `npx http-server`
- **Python**: `python -m http.server 8000`

### Installation & Run

1. Clone or download the repository.
2. Ensure you have the `.splat` files positioned in the `assets` directory as referenced by `assets/dishes.json`'.
3. Open a terminal in the project root directory.
4. Start your local server (e.g., `npx serve .`).
5. Open your browser and navigate to the local URL (e.g., `http://localhost:3000`).

*(Note: WebXR AR features require a compatible device, such as a modern Android phone running Chrome or a WebXR-compatible mixed-reality headset, and must be served over HTTPS unless running on `localhost`).*

## 📁 Project Structure

```text
├── index.html        # Main entry point holding UI layout
├── styles.css        # All styling, animations, and glassmorphic designs
├── main.js           # Core logic (Routing, Three.js, WebXR, Splat Viewer)
├── assets/           
│   ├── dishes.json   # Menu database
│   └── *.splat       # 3D Gaussian splat models
└── README.md         # You are here!
```

## 🛠 Built With

- **HTML5 & Vanilla CSS**: Standard and clean semantic tags. Modern aesthetics using CSS variables and Backdrop-filters.
- **Vanilla JavaScript (ESM)**: No transpilers, no heavy React abstraction.
- **[Three.js (v0.160.0)](https://threejs.org/)**: The backbone of the 3D and WebXR contexts.
- **[Gaussian Splats 3D](https://github.com/mkkellogg/GaussianSplats3D)**: High-performance drop-in renderer for 3D Gaussian Splats.

## 🤝 Customization

To add a new dish, simply:
1. Export your scanned dish as a `.splat` file.
2. Place the file inside the `assets/` directory.
3. Edit `assets/dishes.json` and append your new dish data. It will automatically populate on the main menu!

## 📜 License

Distributed under the MIT License.
