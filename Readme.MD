<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?size=32&duration=2000&color=00AEEF&center=true&vCenter=true&width=780&lines=QUIZ+BOT+%7C+The+WhatsApp+Automation+Engine;Fast%2C+Clean%2C+Lightweight%2C+Ready-to-Deploy;Powered+by+Node.js+and+whatsapp-web.js" />
</p>
<p align="center">
  <img src="https://files.catbox.moe/h19m61.jpg" width="420" />
</p>

---

<p align="center">
  <a href="#features">
    <img src="https://img.shields.io/badge/⭐_Features-Read_More-orange?style=for-the-badge&logo=appveyor&logoColor=white" />
  </a>
  <a href="#install">
    <img src="https://img.shields.io/badge/🚀_Quick_Install-Get_Started-brightgreen?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  </a>
  <a href="#deploy">
    <img src="https://img.shields.io/badge/💻_VPS_Deployment-24%2F7_Setup-blue?style=for-the-badge&logo=serverfault&logoColor=white" />
  </a>
  <a href="#pm2">
    <img src="https://img.shields.io/badge/🕒_Uptime_Control-PM2-red?style=for-the-badge&logo=pm2&logoColor=white" />
  </a>
</p>

---

# 🤖 **Quiz Bot: WhatsApp Automation**

A **simple, fast, and lightweight** WhatsApp Quiz Bot built on **Node.js** and the robust `whatsapp-web.js` library. Perfect for running interactive, multi-user quizzes!

> **Maintained by:** **hdxjpg-sudo**
> 📧 **Email:** `hdxjpg@gmail.com`
> 📱 **WhatsApp:** https://wa.me/918304063560

---

## ⭐ **Key Features** <a name="features"></a>

* ✅ **WhatsApp Web Automation** for seamless operation.
* ✅ **QR Code Login** for easy device linking.
* ✅ **Minimal & Lightweight** Node.js core.
* ✅ **Persistent Score Tracking** for all users.
* ✅ **Multi-User Support** (Quizzes can run concurrently).
* ✅ **Optimized for VPS** environments.
* ✅ Full **PM2 Support** for guaranteed **24/7 uptime**.

---

## 🚀 **Installation Guide** <a name="install"></a>

### **Clone & Run Locally**

Get the bot running on your local machine in minutes.

```bash
# Clone the repository
git clone [https://github.com/umairacm/quiz-bot.git](https://github.com/umairacm/quiz-bot.git)
cd quiz-bot

# Install dependencies
npm install

# Start the bot
npm start

> 🔑 Action Required: Scan the QR code displayed in the terminal using WhatsApp → Linked Devices to connect the bot instance.
> 
💻 VPS Deployment: 24/7 Ready <a name="deploy"></a>
For reliable, continuous operation, deploy on a Virtual Private Server (VPS).
1. Install Prerequisites
We recommend Node.js 20.x for stability.
# Install Node.js 20.x
curl -fsSL [https://deb.nodesource.com/setup_20.x](https://deb.nodesource.com/setup_20.x) | sudo -E bash -
sudo apt install -y nodejs git build-essential

2. Deploy Project
# Clone and navigate
git clone [https://github.com/umairacm/quiz-bot.git](https://github.com/umairacm/quiz-bot.git)
cd quiz-bot

# Install dependencies and start
npm install
npm start

🕒 PM2 Uptime Control <a name="pm2"></a>
Use PM2 to manage the process, ensuring it restarts automatically upon failure and survives reboots.
Install PM2 Globally
sudo npm install -g pm2

Start & Name the Bot
pm2 start quizbot.js --name quiz-bot

Enable Auto-Restart
# Save the current process list
pm2 save

# Generate and configure the startup script
pm2 startup

Monitoring
View real-time logs and status:
# View live logs
pm2 logs quiz-bot

🐳 Docker Deployment (Optional Containerization)
For developers preferring isolated environments:
# Build the Docker image
docker build -t quiz-bot .

# Run the container (interactive mode for QR scan)
docker run -it quiz-bot

🧪 Demo Commands
Start interacting with the bot right away!
| 💬 User Input | 🤖 Bot Response | 💡 Description |
|---|---|---|
| START | Question 1… | Begins a new quiz session. |
| 4 | Correct! | Submits an answer (e.g., option 4). |
| SCORE | Your score is: 5 | Checks current score (if supported). |
<p align="center">
<a href="mailto:hdxjpg@gmail.com">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Email_Me-hdxjpg%2540gmail.com-red%3Fstyle%3Dfor-the-badge%26logo%3Dgmail%26logoColor%3Dwhite" />
</a>
<a href="https://wa.me/918304063560">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Chat_on_WhatsApp-Contact_Support-brightgreen%3Fstyle%3Dfor-the-badge%26logo%3Dwhatsapp%26logoColor%3Dwhite" />
</a>
<a href="https://github.com/hdxjpg-sudo">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Follow_on_GitHub-hdxjpg--sudo-black%3Fstyle%3Dfor-the-badge%26logo%3Dgithub%26logoColor%3Dwhite" />
</a>
</p>

