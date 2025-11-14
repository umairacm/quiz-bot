/**
 * Simple WhatsApp Quiz Bot
 * - Uses whatsapp-web.js (LocalAuth, Puppeteer)
 * - In-memory quiz state (resets on restart)
 *
 * Commands (owner in group):
 *  /newquiz
 *  /addq|Question?|1)A,2)B,3)C,4)D|correctNumber|timeInSeconds
 *  /startquiz
 *  /closejoin
 *  /goqN  (e.g. /goq1)
 *  /addplayer @user
 *  /cancelquiz
 *
 * Player commands:
 *  /join  (in group during join phase)
 *  DM bot with 1-4 to answer
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "quiz-bot"
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('QR RECEIVED, scan with WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('WhatsApp Quiz Bot ready');
});

const quizzes = {}; // key: groupId => quiz object

function createQuiz(chat, ownerId) {
  return {
    groupId: chat.id._serialized,
    owner: ownerId,
    questions: [], // {text, opts:[], correct:1..n, time}
    players: {}, // key: participantId => {id, name, score, answers:{}}
    state: 'idle', // idle | join | running | finished
    joinTimer: null,
    currentQuestionIndex: -1,
    questionState: null // {startTime, timeLimit, answered: Set}
  };
}

function formatLeaderboard(quiz) {
  const players = Object.values(quiz.players).sort((a,b)=>b.score-a.score);
  if (players.length === 0) return 'No players yet.';
  let out = '*Leaderboard*\n';
  players.forEach((p, i) => {
    out += `${i+1}. ${p.name || p.id.split('@')[0]} — ${p.score} pts\n`;
  });
  return out;
}

async function trySetGroupAdminsOnly(chat, value) {
  try {
    await chat.setMessagesAdminsOnly(value);
  } catch (e) {
    // not critical, just log
    console.log('Could not change group messages setting:', e.message || e);
  }
}

client.on('message', async message => {
  const chat = await message.getChat();
  const from = message.from; // id serialized
  const contact = await message.getContact();
  const authorId = message.author || contact.id._serialized; // for group messages message.author exists

  // Auto-assign a globalOwner on first DM if none exists (compat with original note)
  if (!client.globalOwner && chat.isGroup === false) {
    client.globalOwner = authorId;
  }

  // Owner commands in group
  if (chat.isGroup && message.body.startsWith('/')) {
    const body = message.body.trim();
    const groupId = chat.id._serialized;

    if (body === '/newquiz') {
      if (quizzes[groupId]) {
        await chat.sendMessage('There is already a quiz in this group. Use /cancelquiz to cancel it first.');
        return;
      }
      const quiz = createQuiz(chat, authorId);
      quizzes[groupId] = quiz;
      await chat.sendMessage('New quiz created. Use /addq|Question?|1)A,2)B,3)C,4)D|correctNumber|timeInSeconds to add questions. When ready, use /startquiz to open joining.');
      return;
    }

    if (!quizzes[groupId]) return; // no quiz context; ignore other commands

    const quiz = quizzes[groupId];

    // Only quiz owner may run owner commands
    if (authorId !== quiz.owner) {
      await chat.sendMessage('Only the quiz owner can run quiz commands.');
      return;
    }

    if (body.startsWith('/addq|')) {
      // format: /addq|Question?|1)A,2)B,3)C,4)D|correctNumber|timeInSeconds
      const parts = body.split('|');
      if (parts.length < 5) {
        await chat.sendMessage('Invalid format. Use: /addq|Question?|1)A,2)B,3)C,4)D|correctNumber|timeInSeconds');
        return;
      }
      const [cmd, qText, optsStr, correctStr, timeStr] = parts;
      const opts = optsStr.split(',').map(s => s.trim());
      const correct = parseInt(correctStr, 10);
      const timeLimit = Math.max(5, parseInt(timeStr,10) || 15);
      if (!qText || opts.length < 2 || isNaN(correct) || isNaN(timeLimit)) {
        await chat.sendMessage('Invalid question data.');
        return;
      }
      quiz.questions.push({
        text: qText,
        opts,
        correct,
        time: timeLimit
      });
      await chat.sendMessage(`Question added. This quiz now has ${quiz.questions.length} question(s).`);
      return;
    }

    if (body === '/startquiz') {
      if (quiz.questions.length === 0) {
        await chat.sendMessage('Add at least one question first.');
        return;
      }
      if (quiz.state !== 'idle') {
        await chat.sendMessage('Quiz already started or in join phase.');
        return;
      }
      quiz.state = 'join';
      // open 5-minute join window (configurable if desired)
      const joinSeconds = 300;
      await trySetGroupAdminsOnly(chat, true);
      await chat.sendMessage(`Quiz joining is open for ${Math.floor(joinSeconds/60)} minute(s). Players, type /join in this group to participate. Owner can /closejoin to finish joining early.`);
      quiz.joinTimer = setTimeout(async () => {
        if (quiz.state !== 'join') return;
        quiz.state = 'running';
        if (quiz.joinTimer) { clearTimeout(quiz.joinTimer); quiz.joinTimer = null; }
        await trySetGroupAdminsOnly(chat, false);
        await chat.sendMessage('Join phase closed. Quiz is starting.');
        // automatically start first question? We'll wait for /goq1 from owner for more control
      }, joinSeconds * 1000);
      return;
    }

    if (body === '/closejoin') {
      if (quiz.state !== 'join') {
        await chat.sendMessage('Join phase is not open.');
        return;
      }
      quiz.state = 'running';
      if (quiz.joinTimer) { clearTimeout(quiz.joinTimer); quiz.joinTimer = null; }
      await trySetGroupAdminsOnly(chat, false);
      await chat.sendMessage('Join phase closed by owner. Quiz is starting. Use /goq1 to start question 1.');
      return;
    }

    if (body.startsWith('/goq')) {
      const m = body.match(/^\/goq(\d+)$/);
      if (!m) {
        await chat.sendMessage('Invalid command. Use /goqN to start question number N.');
        return;
      }
      const qIdx = parseInt(m[1],10) - 1;
      if (qIdx < 0 || qIdx >= quiz.questions.length) {
        await chat.sendMessage('Question number out of range.');
        return;
      }
      if (quiz.state !== 'running') {
        await chat.sendMessage('Quiz is not running. Ensure join phase closed and quiz started.');
        return;
      }
      // Start the question
      quiz.currentQuestionIndex = qIdx;
      const q = quiz.questions[qIdx];
      quiz.questionState = {
        startTime: Date.now(),
        timeLimit: q.time * 1000,
        answered: new Set()
      };
      // reset per-player answered flags for this question
      Object.values(quiz.players).forEach(p => {
        if (!p.answers) p.answers = {};
      });

      // announce in group
      let msg = `*Question ${qIdx+1}*:\n${q.text}\n`;
      q.opts.forEach((o,i) => msg += `${i+1}. ${o}\n`);
      msg += `\nTime: ${q.time} seconds.\nSend your answer privately to me as a single number (1-${q.opts.length}).`;
      await chat.sendMessage(msg);

      // after timeLimit, evaluate and post leaderboard
      setTimeout(async () => {
        // finalize question
        const correct = q.correct;
        // for players who didn't answer, nothing to do
        // post results summary to group
        let results = `Results for Question ${qIdx+1} (correct: ${correct}):\n`;
        const answeredList = [];
        Object.values(quiz.players).forEach(p => {
          const ansObj = p.answers && p.answers[qIdx];
          if (ansObj) {
            const correctMark = ansObj.answer === correct ? '✅' : '❌';
            results += `${p.name || p.id.split('@')[0]} — ${ansObj.answer} ${correctMark} (+${ansObj.points || 0} pts)\n`;
            answeredList.push(p);
          } else {
            results += `${p.name || p.id.split('@')[0]} — no answer\n`;
          }
        });
        await chat.sendMessage(results);
        // send leaderboard
        await chat.sendMessage(formatLeaderboard(quiz));
        // clear questionState
        quiz.questionState = null;
        // if last question, finish
        if (qIdx === quiz.questions.length - 1) {
          quiz.state = 'finished';
          await chat.sendMessage('Quiz finished! Final leaderboard:');
          await chat.sendMessage(formatLeaderboard(quiz));
          delete quizzes[groupId];
        }
      }, q.time * 1000 + 1000);
      return;
    }

    if (body.startsWith('/addplayer')) {
      // owner can add a mentioned participant (expects mention)
      if (!message.mentionedIds || message.mentionedIds.length === 0) {
        await chat.sendMessage('Mention a user to add with /addplayer @user');
        return;
      }
      const pid = message.mentionedIds[0];
      if (!quiz.players[pid]) {
        quiz.players[pid] = { id: pid, name: pid.split('@')[0], score: 0, answers: {} };
        await chat.sendMessage(`Added ${pid} to the quiz.`);
      } else {
        await chat.sendMessage('Player already added.');
      }
      return;
    }

    if (body === '/cancelquiz') {
      if (quiz.joinTimer) { clearTimeout(quiz.joinTimer); quiz.joinTimer = null; }
      await trySetGroupAdminsOnly(chat, false);
      delete quizzes[groupId];
      await chat.sendMessage('Quiz canceled.');
      return;
    }
  } // end group command handling

  // Player joining in group
  if (chat.isGroup && message.body.trim() === '/join') {
    const groupId = chat.id._serialized;
    const quiz = quizzes[groupId];
    if (!quiz) {
      await chat.sendMessage('There is no active quiz in this group.');
      return;
    }
    if (quiz.state !== 'join') {
      await chat.sendMessage('Join phase is not open.');
      return;
    }
    const pid = authorId;
    if (!quiz.players[pid]) {
      quiz.players[pid] = { id: pid, name: contact.pushname || contact.number || pid.split('@')[0], score: 0, answers: {} };
      await chat.sendMessage(`${contact.pushname || 'Player'} joined the quiz.`);
    } else {
      await chat.sendMessage('You already joined the quiz.');
    }
    return;
  }

  // Private DM answer handling
  if (!chat.isGroup) {
    // If user messages single number while quiz question is active in any group they are part of, record it.
    const text = message.body.trim();
    if (!/^[1-9]\d*$/.test(text)) {
      // not a plain numeric answer; optionally allow owner-first DM assignment or other DM commands
      // If this is first DM ever to the bot, make them global owner (info only)
      if (!client.globalOwner) {
        client.globalOwner = authorId;
        await chat.sendMessage('You are now the bot owner (global). To create quizzes, create one in a group with /newquiz.');
      } else {
        await chat.sendMessage('Send a number 1-4 to answer a quiz question, or DM the group owner if you need help.');
      }
      return;
    }
    const answerNum = parseInt(text,10);
    // Find an active quiz that expects an answer from this user: any quiz with questionState && player is registered
    const activeQuizzes = Object.values(quizzes).filter(q => q.questionState && q.players[authorId]);
    if (activeQuizzes.length === 0) {
      await chat.sendMessage('No active question found for you or you are not registered in an active quiz.');
      return;
    }
    // If multiple, choose the one where the question started most recently
    activeQuizzes.sort((a,b)=> (b.questionState.startTime - a.questionState.startTime));
    const quiz = activeQuizzes[0];
    const qIdx = quiz.currentQuestionIndex;
    const q = quiz.questions[qIdx];
    if (answerNum < 1 || answerNum > q.opts.length) {
      await chat.sendMessage(`Invalid option. Please send a number between 1 and ${q.opts.length}.`);
      return;
    }
    // Check if already answered
    if (quiz.questionState.answered.has(authorId)) {
      await chat.sendMessage('You already answered this question. Only the first answer is counted.');
      return;
    }
    // compute speed-based points
    const now = Date.now();
    const elapsed = now - quiz.questionState.startTime;
    const remaining = Math.max(0, quiz.questionState.timeLimit - elapsed);
    const proportion = remaining / quiz.questionState.timeLimit; // 0..1
    let points = 0;
    if (answerNum === q.correct) {
      // base 100, plus speed factor
      points = Math.max(1, Math.ceil(100 * (0.5 + 0.5 * proportion))); // between 50..100-ish
    }
    // register answer
    quiz.questionState.answered.add(authorId);
    const player = quiz.players[authorId];
    player.answers[qIdx] = {
      answer: answerNum,
      time: elapsed,
      points: points
    };
    player.score = (player.score || 0) + points;
    await chat.sendMessage(`Answer received${points > 0 ? ` — correct! +${points} pts` : ' — incorrect.'}`);
    return;
  }

});

// Safe exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  client.destroy();
  process.exit();
});

client.initialize();
