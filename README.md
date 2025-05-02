---

# 🚀 RISC-V Simulator (Unicycle + Pipeline) with Next.js Frontend

This project is a **web-based RISC-V simulator** supporting both **unicycle** and **pipeline (multi-cycle)** execution models. It features a **Next.js** frontend for interactive visualization and a **C++ backend** for core simulation logic.

Key features:
- 🖥️ **Unicycle simulation:** Step-by-step single-cycle RISC-V instruction execution.
- 🚂 **Pipeline simulation:** Visualizes the 5-stage RISC-V pipeline (IF, ID, EX, MEM, WB) with hazard tracking and interstage buffer data.
- 🔌 **API integration:** The frontend communicates with the C++ simulator via HTTP APIs (and optionally WebSockets for live updates).

---

## ✨ Features

- **Next.js (React) Frontend:**
  - Interactive simulator controls (step, play, pause, reset).
  - Visualization of pipeline stages with detailed tables and animations.
  - Displays interstage buffers and hazard/forwarding indicators.
  
- **C++ Backend:**
  - Parses RISC-V assembly programs.
  - Simulates both unicycle and pipelined execution.
  - Provides pipeline state as JSON to the frontend.

- **Additional Features:**
  - Auto-run mode for continuous stepping.
  - Cycle counter & instruction limit enforcement.
  - Modular API routes for easy integration and expansion.

---

## 🛠 Getting Started

### 1️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 2️⃣ Start the Next.js Frontend

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the simulator UI.

### 3️⃣ Set Up & Run the C++ Backend

- Build and run your C++ RISC-V simulator (ensure it runs an HTTP server exposing API endpoints like `/api/pipe`).

Example:
```bash
you can use makefile to execute the c++ code or the .sh files.

```

💡 Make sure the backend is running **before** using the simulator to fetch pipeline data!

## 🧩 Project Structure

- `/app`: Next.js frontend code.
- `/app/api/`: Custom API routes for interacting with the backend.
- `/executable_phase1`: Executables that convert assembly code into machine code.
- `/executable_phase2`: Mom pipelined, unicycle version of RISCV simulator.
- `/executables_phase3`: JSON files with the current pipeline state.

---

## 📖 Learn More

- [RISC-V ISA](https://riscv.org/technical/specifications/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Crow C++ HTTP Framework](https://crowcpp.org/) 

---

## 🛫 Deploy on Vercel

To deploy your frontend:

Make sure your C++ backend is hosted separately (e.g., on a VM or container service). I'm using Docker container for the same.

---

## 🙌 Contributing

Contributions, bug reports, and feature requests are welcome! Feel free to fork this repo and submit pull requests.

---

## 📄 License

This project is licensed under the MIT License.

---
