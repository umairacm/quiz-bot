# WhatsApp Quiz Bot

A WhatsApp group quiz bot using `whatsapp-web.js`.

### 🧠 Features
- Owner = WhatsApp number that links the bot
- Configurable per-question timer
- Private answers (DM)
- Group locked (admin-only) during quiz
- Leaderboard + timed scoring

### ⚙️ Commands
| Command | Description |
|----------|--------------|
| `/newquiz` | Create new quiz |
| `/addq|Q|opts|ans|time` | Add question |
| `/startquiz` | Open join phase |
| `/closejoin` | Close joining, start quiz |
| `/join` | Player joins |
| `/addplayer @user` | Owner adds player |
| `/goq1` | Start question 1 |
| `/cancelquiz` | Cancel quiz |
| `/settime` | Not needed (per question) |

### 🚀 Run
```bash
npm install
npm start
