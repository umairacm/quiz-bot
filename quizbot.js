// whatsapp-quiz-bot v7
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

let OWNER = null;
let quizzes = {}; // groupId => quizData

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ Quiz Bot Ready!'));

client.on('message', async message => {
  const chat = await message.getChat();
  const sender = message.author || message.from;
  const text = message.body.trim();

  // Detect owner automatically (linked device)
  if (!OWNER && !chat.isGroup) OWNER = sender;

  // === PRIVATE ANSWERS (DM) ===
  if (!chat.isGroup) {
    for (const [groupId, quiz] of Object.entries(quizzes)) {
      if (quiz.active && quiz.joined.has(sender)) {
        handlePrivateAnswer(message, groupId);
        return;
      }
    }
    return;
  }

  // === GROUP MESSAGE ===
  const groupId = chat.id._serialized;
  if (!quizzes[groupId] && !text.startsWith('/newquiz')) return;

  const quiz = quizzes[groupId];
  const isOwner = sender === OWNER;

  // === OWNER COMMANDS ===
  if (isOwner) {
    if (text === '/newquiz') {
      quizzes[groupId] = {
        questions: [],
        joined: new Set(),
        answers: {},
        leaderboard: {},
        active: false,
        currentIndex: 0,
        joinOpen: false,
        joinTimer: null
      };
      chat.sendMessage('🧩 New quiz created! Use `/addq|Question?|1)A,2)B,3)C,4)D|correctNumber|time`');
      return;
    }

    if (text.startsWith('/addq')) {
      const parts = text.split('|');
      if (parts.length < 5) {
        chat.sendMessage('⚠️ Format: /addq|Question?|1)A,2)B,3)C,4)D|correctNumber|timeInSeconds');
        return;
      }
      const question = parts[1].trim();
      const options = parts[2].split(',').map(o => o.trim());
      const correct = parts[3].trim();
      const time = parseInt(parts[4].trim()) || 20;
      quiz.questions.push({ question, options, correct, time });
      chat.sendMessage(`✅ Question ${quiz.questions.length} added (time ${time}s).`);
      return;
    }

    if (text === '/startquiz') {
      if (!quiz.questions.length) {
        chat.sendMessage('⚠️ No questions added yet.');
        return;
      }
      quiz.joinOpen = true;
      quiz.joined.clear();
      chat.sendMessage('🎮 *Quiz starting!* Type `/join` to participate (5 min).');
      quiz.joinTimer = setTimeout(() => {
        if (quiz.joined.size === 0) {
          chat.sendMessage('❌ No players joined. Quiz cancelled.');
          delete quizzes[groupId];
        } else {
          closeJoinPhase(chat, quiz);
        }
      }, 5 * 60 * 1000);
      return;
    }

    if (text === '/closejoin') {
      if (!quiz.joinOpen) return chat.sendMessage('⚠️ Join phase not active.');
      clearTimeout(quiz.joinTimer);
      closeJoinPhase(chat, quiz);
      return;
    }

    if (text.startsWith('/addplayer')) {
      const mention = message.mentionedIds?.[0];
      if (!mention) return chat.sendMessage('⚠️ Mention a user to add.');
      quiz.joined.add(mention);
      chat.sendMessage(`✅ Added <@${mention.split('@')[0]}> to the quiz.`, { mentions: [mention] });
      return;
    }

    if (text.startsWith('/goq')) {
      const qNum = parseInt(text.replace('/goq', '').trim()) - 1;
      if (isNaN(qNum) || qNum < 0 || qNum >= quiz.questions.length)
        return chat.sendMessage('⚠️ Invalid question.');
      startQuestion(chat, quiz, qNum);
      return;
    }

    if (text === '/cancelquiz') {
      chat.sendMessage('🛑 Quiz cancelled. Group unlocked.');
      chat.setMessagesAdminsOnly(false);
      delete quizzes[groupId];
      return;
    }
  }

  // === PLAYER COMMANDS ===
  if (text === '/join' && quiz?.joinOpen) {
    quiz.joined.add(sender);
    chat.sendMessage(`✅ ${message._data.notifyName || 'Player'} joined!`);
  }
});

async function closeJoinPhase(chat, quiz) {
  quiz.joinOpen = false;
  quiz.active = true;
  await chat.setMessagesAdminsOnly(true);
  chat.sendMessage(`🚫 Joining closed. Group locked.\n${quiz.joined.size} players joined.`);
}

async function startQuestion(chat, quiz, qNum) {
  quiz.currentIndex = qNum;
  const q = quiz.questions[qNum];
  quiz.answers = {};
  const questionText = `*Q${qNum + 1}) ${q.question}*\n${q.options.join('\n')}\n\n⏱️ ${q.time}s to answer in DM!`;

  chat.sendMessage(questionText);

  for (const player of quiz.joined) {
    client.sendMessage(player, `📢 ${questionText}`);
  }

  setTimeout(() => endQuestion(chat, quiz, qNum), q.time * 1000);
}

async function handlePrivateAnswer(message, groupId) {
  const quiz = quizzes[groupId];
  if (!quiz?.active) return;

  const user = message.from;
  const text = message.body.trim();
  const num = parseInt(text);
  if (isNaN(num)) return message.reply('⚠️ Please reply with a number (1–4).');

  if (quiz.answers[user]) {
    return message.reply('⏱️ You already answered.');
  }

  const now = Date.now();
  if (!quiz.startTime) quiz.startTime = now;
  const elapsed = (now - quiz.startTime) / 1000;

  quiz.answers[user] = { choice: num, time: elapsed };
  message.reply('✅ Answer received!');
}

async function endQuestion(chat, quiz, qNum) {
  const q = quiz.questions[qNum];
  const results = [];
  quiz.startTime = null;

  for (const [user, data] of Object.entries(quiz.answers)) {
    const correct = data.choice == q.correct;
    if (correct) {
      results.push({ user, time: data.time });
      if (!quiz.leaderboard[user]) quiz.leaderboard[user] = 0;
    }
  }

  results.sort((a, b) => a.time - b.time);
  results.forEach((r, i) => {
    const points = Math.max(5 - i, 1);
    quiz.leaderboard[r.user] += points;
  });

  const correctOption = q.options[q.correct - 1] + ' ✅';
  const finalQ = `*${q.question}*\n${q.options
    .map((opt, i) => (i + 1 == q.correct ? `${opt} ✅` : opt))
    .join('\n')}`;

  chat.sendMessage(finalQ);

  let board = '🏆 *Leaderboard:*\n';
  const sorted = Object.entries(quiz.leaderboard).sort((a, b) => b[1] - a[1]);
  sorted.forEach(([user, score], i) => {
    board += `${i + 1}. @${user.split('@')[0]} – ${score} pts\n`;
  });
  chat.sendMessage(board, { mentions: sorted.map(s => s[0]) });

  // Private results
  for (const player of quiz.joined) {
    const ans = quiz.answers[player];
    const correct = ans && ans.choice == q.correct;
    const rank = sorted.findIndex(s => s[0] === player) + 1;
    if (correct) {
      client.sendMessage(player, `✅ Correct! You took ${ans.time.toFixed(1)}s.\n🏅 You are #${rank}.`);
    } else {
      client.sendMessage(player, `❌ Wrong. Correct: ${q.options[q.correct - 1]}.\n🏅 You are #${rank}.`);
    }
  }

  // Unlock if last question
  if (qNum + 1 === quiz.questions.length) {
    await chat.setMessagesAdminsOnly(false);
    chat.sendMessage('🏁 Quiz finished! Group unlocked.');
    delete quizzes[chat.id._serialized];
  }
}

client.initialize();
