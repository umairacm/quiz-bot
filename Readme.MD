# Quiz Bot
*A simple WhatsApp Node.js bot*

![Preview](https://files.catbox.moe/h19m61.jpg)

<!-- Buttons (badge-style "buttons") -->
[![Run Locally](https://img.shields.io/badge/Run%20Locally-%E2%96%B6%20Start-brightgreen?style=for-the-badge)](#quick-start)
[![Deploy VPS](https://img.shields.io/badge/Deploy-VPS-blue?style=for-the-badge)](#vps-deploy)
[![Replit](https://img.shields.io/badge/Replit-Deploy-orange?style=for-the-badge)](#replit)
[![PM2](https://img.shields.io/badge/Manager-PM2-lightgrey?style=for-the-badge)](#pm2-keep-alive)

---

## Overview
Quiz Bot is a lightweight WhatsApp automation bot built with **Node.js** and **whatsapp-web.js**.  
It shows a QR for login and runs quizzes inside WhatsApp chats.

---

## ✨ Quick Start <a name="quick-start"></a>
```bash
git clone https://github.com/umairacm/quiz-bot.git
cd quiz-bot
npm install
npm start

Scan the QR printed in the terminal using WhatsApp → Linked Devices.


---

🔧 VPS Deploy (Ubuntu) <a name="vps-deploy"></a>

1. Connect to your VPS and update:



sudo apt update && sudo apt upgrade -y

2. Install Node.js (20.x LTS example):



curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

3. Clone & install:



git clone https://github.com/umairacm/quiz-bot.git
cd quiz-bot
npm install

4. Start:



npm start


---

🔁 Keep it running with PM2 <a name="pm2-keep-alive"></a>

Install PM2:

sudo npm install -g pm2

Start and enable on reboot:

pm2 start quizbot.js --name quiz-bot
pm2 save
pm2 startup

View logs:

pm2 logs quiz-bot


---

🟠 Replit Deploy <a name="replit"></a>

1. Create a new Node.js Repl.


2. Import your GitHub repo.


3. Run npm install in the console.


4. Click Run — QR appears in the console.



> Keep the Repl running (use Replit's Always On if available).




---

⚙️ Notes

First run requires scanning QR; after scanning you can save session (session persistence) to avoid repeated scans.

If using Puppeteer on VPS, ensure required libraries are present (or use PUPPETEER_SKIP_CHROMIUM_DOWNLOAD and install chrome/chromium via package manager).



---

Commands (example)

!startquiz — Start a quiz

!stopquiz — Stop current quiz

!score — Show your score

ping — Bot alive test



---

Maintainer

hdxjpg-sudo
Email: hdxjpg@gmail.com
WhatsApp: https://wa.me/918304063560


---

License

MIT
