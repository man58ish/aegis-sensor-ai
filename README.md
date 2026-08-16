# ⚡ AEGIS // NEXUS 
**Industrial IoT Telemetry & Cognitive AI Override System**

![Aegis Nexus Banner](https://img.shields.io/badge/STATUS-UPLINK_STABLE-emerald?style=for-the-badge&logo=opslevel)
![Next.js](https://img.shields.io/badge/Next.js_14-Black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js_Cluster-339933?style=for-the-badge&logo=node.js)
![Socket.io](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io)
![MQTT](https://img.shields.io/badge/MQTT_Aedes-660066?style=for-the-badge&logo=mqtt)

**AEGIS // NEXUS** is a production-ready, high-performance Industrial IoT dashboard designed to ingest, monitor, and analyze real-time sensor telemetry. Built with a robust Master-Worker cluster architecture, it features AI-driven anomaly detection, real-time waveform visualization, and a two-way hardware emergency shutdown system.

---

## ✨ Key Features

- **🚀 Distributed Master-Worker Architecture:** Node.js cluster utilizing all CPU cores with an embedded Aedes MQTT Broker and IPC (Inter-Process Communication) message routing.
- **📡 Multi-Protocol Data Ingestion:** Supports high-frequency telemetry streaming via both MQTT (Port 1883) and HTTP POST endpoints.
- **⚡ Real-Time Cyberpunk UI:** Built with Next.js 14 and Tailwind CSS, featuring glassmorphism, CRT scanline overlays, and a lag-free SVG waveform chart.
- **🧠 Cognitive Anomaly Detection:** Automatically detects thermal shock risks (e.g., temperatures > 100°C) and triggers visual alerts.
- **🛑 Two-Way Emergency Override:** Hardware relay cut-off signals can be fired directly from the UI, relayed through WebSockets to the Master Node, and published via MQTT to edge devices.
- **🛡️ Production Grade Safety:** Integrated with `opossum` Circuit Breakers, `express-rate-limit`, Sticky Sessions, and auto-healing worker nodes.
- **🎮 Built-In Edge Simulator:** Interactive UI-based simulator and standalone Node.js scripts to demo the project without physical hardware.

---

## 📂 Monorepo Architecture

```text
aegis-sensor-ai/
│
├── apps/web/                  # 🌐 Frontend (Next.js 14)
│   ├── app/
│   │   ├── page.tsx           # Main Dashboard UI (Cyberpunk Theme)
│   │   └── globals.css        # Tailwind & Custom Scanline CSS
│   ├── tailwind.config.js     
│   └── package.json           
│
├── server/                    # ⚙️ Backend (Node.js Cluster)
│   ├── src/
│   │   ├── cluster.ts         # Master/Worker Logic, Aedes MQTT, Express Ingest
│   │   ├── db/connect.ts      # MongoDB Connection
│   │   ├── models/            # Mongoose Schemas (Telemetry)
│   │   └── sockets/           # Modular Socket Handlers
│   └── package.json           
│
├── simulator/                 # 📡 IoT Hardware Mocker
│   ├── simulate.js            # Axios-based automatic telemetry streamer
│   └── package.json           
│
├── vercel.json                # Vercel Deployment Config
└── README.md





aegis-sensor-ai/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── next.config.js
│       ├── package.json
│       ├── tailwind.config.js
│       └── tsconfig.json
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   └── connect.ts
│   │   ├── models/
│   │   │   └── Telemetry.ts
│   │   ├── sockets/
│   │   │   └── telemetrySocket.ts
│   │   └── cluster.ts
│   ├── package.json
│   └── tsconfig.json
├── simulator/
│   ├── package.json
│   └── simulate.js
├── .gitignore
├── package.json
├── README.md
└── vercel.json



🛠️ Tech Stack
Frontend [Client Node]
Framework: Next.js 14 (App Router)

Styling: Tailwind CSS (Glassmorphism, Complex Gradients)

Icons: Lucide-React

Real-Time Client: Socket.io-client (Pure WebSocket Transport)

Backend [Gateway Cluster]
Runtime: Node.js (Cluster Module)

API Framework: Express.js

Real-Time Engine: Socket.io (with @socket.io/cluster-adapter)

IoT Protocol: Aedes (MQTT Broker) + mqtt.js

Security & Stability: Helmet, Opossum (Circuit Breaker), Rate Limiter

Database: MongoDB (Mongoose)

🚀 Getting Started (Local Development)
1. Clone the Repository
Bash
git clone [https://github.com/man58ish/aegis-sensor-ai.git](https://github.com/man58ish/aegis-sensor-ai.git)
cd aegis-sensor-ai
2. Setup Backend (Server)
Bash
cd server
npm install
# Create a .env file and add PORT=5000, MONGO_URI, etc.
npm run dev
The backend will boot up the Master node on port 5000 and the MQTT broker on port 1883.

3. Setup Frontend (Web)
Open a new terminal window:

Bash
cd apps/web
npm install
# Create a .env.local file and add NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
npm run dev
Access the dashboard at http://localhost:3000.

4. Run the IoT Simulator (Optional)
To test the live waveform without physical hardware:

Bash
cd simulator
npm install
node simulate.js
This will stream randomized temperature anomalies directly to the backend.

☁️ Deployment Guide
Frontend (Vercel)
Import the repository into Vercel.

Under Settings > General > Root Directory, select apps/web (or rely on vercel.json).

Add Environment Variable: NEXT_PUBLIC_SOCKET_URL = https://your-railway-app.up.railway.app

Deploy.

Backend (Railway / Render)
Connect the repository and set the Root Directory to /server.

Ensure the Build Command is npm install && npm run build and Start Command is npm start.

Set Environment Variables (PORT, MONGO_URI).

Note: The cluster is capped to 2 workers to prevent memory exhaustion on free/hobby tiers.

⚠️ Disclaimer
This is a portfolio project designed to demonstrate full-stack IoT architecture, real-time data streaming, and modern UI/UX principles. The "AI Cognitive Engine" is a simulated UI placeholder for demonstration purposes.

Developed by Manish Anuragi | GitHub


### Terminal se Push Karein:
```powershell
git add README.md
git commit -m "docs: add comprehensive premium README for project showcase"
git push origin main
