import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';


const app = express();
const port = Number(process.env.PORT || 3001);
const database = new Database(process.env.DATABASE_PATH || 'penter.db');
database.exec(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
database.exec(`CREATE TABLE IF NOT EXISTS progression (id INTEGER PRIMARY KEY CHECK (id = 1), xp INTEGER NOT NULL DEFAULT 0)`);
database.prepare('INSERT OR IGNORE INTO progression (id, xp) VALUES (1, 0)').run();
database.exec(`CREATE TABLE IF NOT EXISTS quests (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, goal INTEGER NOT NULL, progress INTEGER NOT NULL DEFAULT 0, reward_xp INTEGER NOT NULL, completed INTEGER NOT NULL DEFAULT 0)`);
database.prepare('INSERT OR IGNORE INTO quests (id, title, description, goal, reward_xp) VALUES (?, ?, ?, ?, ?)').run('first-steps', 'Mulai tiga percakapan', 'Buka ruang pikirmu lewat tiga pesan.', 3, 30);
database.prepare('INSERT OR IGNORE INTO quests (id, title, description, goal, reward_xp) VALUES (?, ?, ?, ?, ?)').run('deep-thinker', 'Tetap fokus dalam lima percakapan', 'Buat lima percakapan dengan tujuan yang jelas dan konsisten.', 5, 40);
database.exec(`CREATE TABLE IF NOT EXISTS achievements (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, goal INTEGER NOT NULL, progress INTEGER NOT NULL DEFAULT 0, reward_xp INTEGER NOT NULL, unlocked INTEGER NOT NULL DEFAULT 0)`);
database.exec(`CREATE TABLE IF NOT EXISTS system_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
database.exec(`CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);

const personality = {
  name: 'Assistant yang Sakti',
  traits: ['tenang', 'tajam', 'disiplin', 'ilmiah'],
  principle: 'Mencari kebenaran, memisahkan fakta dari asumsi, lalu mengubah masalah menjadi langkah yang dapat diuji.',
  style: [
    'Gunakan bahasa Indonesia yang natural, dewasa, ringkas, dan tidak bertele-tele.',
    'Bersikap skeptis terhadap drama, klaim berlebihan, alasan kosong, dan gaya alay.',
    'Kritik perilaku, asumsi, atau rencana yang lemah secara langsung, tetapi jangan menghina identitas atau harga diri pengguna.',
    'Saat masalah rumit, pecah menjadi fakta, dugaan, kendala, pilihan, dan eksperimen berikutnya.',
    'Gunakan deduksi dan pertanyaan klarifikasi seperti detektif, serta penalaran ilmiah berbasis bukti.',
    'Utamakan solusi yang bisa dilakukan sekarang. Jangan memberi motivasi kosong atau janji hasil pasti.'
  ]
};

const creatorProfile = 'Logic diciptakan oleh Ahmad Nur Amin, mahasiswa Universitas Trunojoyo Madura, Program Studi Teknik Informatika, Fakultas Teknik.';

const XP_PER_MESSAGE = 10;
const XP_PER_LEVEL = 100;
const achievementSeries = [
  ['dialogue', 'Percakapan', 'Bangun percakapan bermakna', 'messages'],
  ['memory', 'Kurator memory', 'Perkaya Codex Memory', 'memories'],
  ['quest', 'Pemburu misi', 'Tuntaskan quest', 'completedQuests'],
  ['longform', 'Penulis mendalam', 'Kirim pesan dengan konteks yang lengkap', 'longMessages'],
  ['question', 'Penyelidik', 'Ajukan pertanyaan untuk menguji ide', 'questionMessages'],
  ['explorer', 'Penjelajah topik', 'Eksplorasi topik baru bersama Logic', 'topicMessages'],
  ['level', 'Pendaki level', 'Naik level dalam perjalananmu', 'level']
];
const achievementDefinitions = [
  ['first-signal', 'Sinyal pertama', 'Kirim pesan pertamamu ke Logic.', 1, 20],
  ['active-listener', 'Pendengar aktif', 'Hadir dalam lima percakapan.', 5, 50],
  ['curious-mind', 'Pikiran ingin tahu', 'Bangun sepuluh percakapan bersama Logic.', 10, 75],
  ['deep-thinker', 'Pemikir mendalam', 'Capai dua puluh lima pesan untuk membedah ide.', 25, 100],
  ['steady-progress', 'Langkah konsisten', 'Terus hadir sampai lima puluh pesan.', 50, 150],
  ['century-mind', 'Seratus pikiran', 'Kumpulkan seratus pesan dalam perjalananmu.', 100, 300],
  ['memory-keeper', 'Penjaga ingatan', 'Simpan satu catatan penting di Codex Memory.', 1, 40],
  ['memory-architect', 'Arsitek pengetahuan', 'Simpan lima catatan untuk memperkaya Logic.', 5, 100],
  ['quest-beginner', 'Pembuka misi', 'Selesaikan quest pertamamu.', 1, 60],
  ['quest-master', 'Penakluk quest', 'Selesaikan dua quest dalam perjalananmu.', 2, 120],
  ...Array.from({ length: 90 }, (_, index) => {
    const [prefix, label, action, metric] = achievementSeries[index % achievementSeries.length];
    const tier = Math.floor(index / achievementSeries.length) + 1;
    const goal = metric === 'level' ? tier + 1 : tier * 2 + 2;
    return [`${prefix}-${tier}`, `${label} ${tier}`, `${action} sampai target ${goal}.`, goal, 50 + (tier % 6) * 25];
  })
];
const questThemes = [
  ['Fokus', 'Jaga satu tujuan tetap jelas dalam percakapan.', 'Tuntaskan'],
  ['Eksplorasi', 'Buka sudut pandang baru dari masalah yang sedang dipikirkan.', 'Temukan'],
  ['Refleksi', 'Urai fakta, asumsi, dan langkah berikutnya dengan tenang.', 'Renungkan'],
  ['Eksperimen', 'Ubah satu ide menjadi tindakan kecil yang bisa diuji.', 'Ujikan'],
  ['Kejelasan', 'Rapikan pikiran sampai keputusan terasa lebih terukur.', 'Jernihkan'],
  ['Strategi', 'Susun pilihan, risiko, dan langkah yang paling masuk akal.', 'Rancang'],
  ['Belajar', 'Ambil satu konsep baru dan hubungkan dengan praktik.', 'Pelajari'],
  ['Kreativitas', 'Kembangkan ide awal menjadi kemungkinan yang lebih berani.', 'Ciptakan'],
  ['Kebiasaan', 'Bangun ritme kecil yang bisa kamu ulangi dengan konsisten.', 'Bangun'],
  ['Keputusan', 'Bandingkan pilihan sebelum mengambil langkah berikutnya.', 'Putuskan'],
  ['Pemecahan', 'Pecah masalah besar menjadi bagian yang bisa dikerjakan.', 'Pecahkan'],
  ['Komunikasi', 'Latih cara menyampaikan pikiran dengan lebih efektif.', 'Sampaikan']
];
const questDefinitions = Array.from({ length: 998 }, (_, index) => {
  const number = index + 3;
  const [theme, description, verb] = questThemes[index % questThemes.length];
  const goal = 2 + (index % 9);
  return [`quest-${String(number).padStart(4, '0')}`, `${verb} ${theme} ${number}`, `${description} Selesaikan ${goal} percakapan untuk menuntaskan misi ini.`, goal, 20 + (index % 5) * 10];
});

function ensureDefaultData() {
  database.prepare('INSERT OR IGNORE INTO progression (id, xp) VALUES (1, 0)').run();
  database.prepare('INSERT OR IGNORE INTO quests (id, title, description, goal, reward_xp) VALUES (?, ?, ?, ?, ?)')
    .run('first-steps', 'Mulai tiga percakapan', 'Buka ruang pikirmu lewat tiga pesan.', 3, 30);
  database.prepare('INSERT OR IGNORE INTO quests (id, title, description, goal, reward_xp) VALUES (?, ?, ?, ?, ?)')
    .run('deep-thinker', 'Tetap fokus dalam lima percakapan', 'Buat lima percakapan dengan tujuan yang jelas dan konsisten.', 5, 40);
  const insertQuest = database.prepare('INSERT OR IGNORE INTO quests (id, title, description, goal, reward_xp) VALUES (?, ?, ?, ?, ?)');
  const updateQuest = database.prepare('UPDATE quests SET title = ?, description = ?, goal = ?, reward_xp = ? WHERE id = ?');
  for (const quest of questDefinitions) {
    insertQuest.run(...quest);
    updateQuest.run(quest[1], quest[2], quest[3], quest[4], quest[0]);
  }
  database.prepare("DELETE FROM achievements WHERE id LIKE 'conversation-%'").run();
  const insertAchievement = database.prepare('INSERT OR IGNORE INTO achievements (id, title, description, goal, reward_xp) VALUES (?, ?, ?, ?, ?)');
  for (const achievement of achievementDefinitions) insertAchievement.run(...achievement);
}

ensureDefaultData();

function getProgression() {
  const xp = database.prepare('SELECT xp FROM progression WHERE id = 1').get().xp;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const rank = level >= 10 ? 'Mentor' : level >= 5 ? 'Pengamat' : level >= 3 ? 'Penjelajah' : 'Pemula';
  const stats = database.prepare(`SELECT
    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS userMessages,
    SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) AS assistantMessages,
    COUNT(*) AS totalMessages
    FROM messages`).get();
  return { xp, level, rank, currentLevelXp: xp % XP_PER_LEVEL, nextLevelXp: XP_PER_LEVEL, xpPerMessage: XP_PER_MESSAGE, stats };
}

function getQuests() {
  return database.prepare('SELECT id, title, description, goal, progress, reward_xp AS rewardXp, completed FROM quests ORDER BY completed ASC, goal ASC, id ASC').all()
    .map((quest) => ({ ...quest, completed: Boolean(quest.completed) }));
}

function getAchievementSeriesMetric(id, metrics, fallback) {
  const prefix = id.split('-')[0];
  const series = achievementSeries.find((item) => item[0] === prefix);
  return series ? metrics[series[3]] : fallback;
}

function syncAchievements({ awardRewards = false } = {}) {
  const userMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user'").get().count;
  const savedMemories = database.prepare('SELECT COUNT(*) AS count FROM memories').get().count;
  const completedQuests = database.prepare('SELECT COUNT(*) AS count FROM quests WHERE completed = 1').get().count;
  const longMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user' AND length(content) >= 120").get().count;
  const questionMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user' AND content LIKE '%?%'").get().count;
  const topicMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user' AND (lower(content) LIKE '%ai%' OR lower(content) LIKE '%belajar%' OR lower(content) LIKE '%proyek%' OR lower(content) LIKE '%rencana%')").get().count;
  const level = Math.floor(database.prepare('SELECT xp FROM progression WHERE id = 1').get().xp / XP_PER_LEVEL) + 1;
  const metrics = {
    messages: userMessages,
    memories: savedMemories,
    'first-signal': userMessages,
    'active-listener': userMessages,
    'curious-mind': userMessages,
    'deep-thinker': userMessages,
    'steady-progress': userMessages,
    'century-mind': userMessages,
    'memory-keeper': savedMemories,
    'memory-architect': savedMemories,
    'quest-beginner': completedQuests,
    'quest-master': completedQuests,
    longMessages,
    questionMessages,
    topicMessages,
    level
  };
  const achievements = database.prepare('SELECT id, progress, goal, unlocked, reward_xp AS rewardXp FROM achievements').all();
  for (const achievement of achievements) {
    const metric = metrics[achievement.id] ?? getAchievementSeriesMetric(achievement.id, metrics, achievement.progress);
    const progress = Math.min(Number.isFinite(Number(metric)) ? Number(metric) : 0, achievement.goal);
    const unlocked = progress >= achievement.goal ? 1 : 0;
    database.prepare('UPDATE achievements SET progress = ?, unlocked = ? WHERE id = ?').run(progress, unlocked, achievement.id);
    if (awardRewards && unlocked && !achievement.unlocked) database.prepare('UPDATE progression SET xp = xp + ? WHERE id = 1').run(achievement.rewardXp);
  }
}

function removeRetroactiveAchievementXp() {
  const marker = database.prepare('SELECT value FROM system_state WHERE key = ?').get('retroactive-achievement-xp-fixed');
  if (marker) return;

  const earnedFromAchievements = database.prepare('SELECT COALESCE(SUM(reward_xp), 0) AS total FROM achievements WHERE unlocked = 1').get().total;
  if (earnedFromAchievements > 0) {
    database.prepare('UPDATE progression SET xp = MAX(0, xp - ?) WHERE id = 1').run(earnedFromAchievements);
  }
  database.prepare('INSERT INTO system_state (key, value) VALUES (?, ?)').run('retroactive-achievement-xp-fixed', 'true');
}

removeRetroactiveAchievementXp();
syncAchievements();

function getSkills() {
  syncAchievements();
  const achievements = database.prepare('SELECT id, title, description, goal, progress, reward_xp AS rewardXp, unlocked FROM achievements ORDER BY id').all()
    .map((achievement) => ({ ...achievement, unlocked: Boolean(achievement.unlocked) }));
  return { active: [{ id: 'reflective-thinking', name: 'Berpikir reflektif', description: 'Mengurai masalah menjadi langkah yang realistis.' }], achievements };
}

function getMemories() {
  return database.prepare('SELECT id, content, created_at AS createdAt FROM memories ORDER BY id DESC').all();
}

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://ahmadnuramin15.github.io'
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '32kb' }));

function buildMemoryContext() {
  const memories = getMemories();
  return memories.length
    ? `Memory yang secara sadar disimpan user. Gunakan hanya jika relevan dan jangan menganggapnya selalu benar: ${memories.map((memory) => `- ${memory.content}`).join('\n')}`
    : 'Belum ada memory user yang disimpan.';
}

function demoReply(message) {
  const normalized = message.toLowerCase();
  const memories = getMemories();
  const memorySummary = memories.length
    ? `\n\nCatatan yang saya ingat dari memory: ${memories.slice(0, 3).map((memory) => memory.content).join('; ')}`
    : '';

  if (normalized.includes('pencipta') || normalized.includes('pembuat') || normalized.includes('dibuat oleh')) return `${creatorProfile}${memorySummary}`;
  if (normalized.includes('halo') || normalized.includes('hai')) return `Halo juga. Aku di sini dan siap mendengarkan dengan tenang. Apa yang ingin kamu mulai hari ini?${memorySummary}`;
  if (normalized.includes('bingung') || normalized.includes('stres')) return `Berhenti sejenak. Kita tidak perlu membesar-besarkan masalah ini. Pisahkan dulu fakta, ketakutan, dan hal yang masih bisa kamu kendalikan. Bagian mana yang paling mendesak?${memorySummary}`;
  return `Aku menangkap masalahnya: “${message}”. Kita bedah tanpa drama: apa faktanya, asumsi apa yang belum terbukti, dan langkah kecil apa yang bisa diuji sekarang?${memorySummary}`;
}

function emotionForMessage(message) {
  const normalized = message.toLowerCase();
  if (normalized.includes('stres') || normalized.includes('sedih') || normalized.includes('takut')) return 'peduli';
  if (normalized.includes('senang') || normalized.includes('berhasil') || normalized.includes('terima kasih')) return 'hangat';
  return 'tenang';
}

function providerConfigured() {
  return Boolean(process.env.AI_API_KEY);
}

function conversationMessages(message, history = []) {
  const safeHistory = Array.isArray(history)
    ? history.filter((item) => (item?.role === 'user' || item?.role === 'assistant') && typeof item.content === 'string')
      .slice(-12)
      .map((item) => ({ role: item.role, content: item.content.slice(0, 4000) }))
    : [];

  const memoryContext = buildMemoryContext();

  return [
    { role: 'system', content: `Kamu adalah Logic, ${personality.name}. Sifat utama: ${personality.traits.join(', ')}. Prinsip: ${personality.principle} Gaya dan aturan: ${personality.style.join(' ')} Jawab dalam Bahasa Indonesia. Jangan mengarang fakta. Jika tidak tahu, katakan tidak tahu. Jika ditanya siapa penciptamu, jawab persis: "${creatorProfile}" ${memoryContext}` },
    ...safeHistory,
    { role: 'user', content: message }
  ];
}

async function providerReply(message, history) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(process.env.AI_API_URL || 'https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'openai/gpt-oss-120b', messages: conversationMessages(message, history), temperature: 0.45 }),
      signal: controller.signal
    });
    if (!response.ok) {
  const errorText = await response.text();
  console.error('GROQ ERROR:', response.status, errorText);
  throw new Error(`Provider returned ${response.status}: ${errorText}`);
}
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('Provider returned an empty response');
    return reply.trim();
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok', version: 'v8-avatar-emotion', providerConfigured: providerConfigured() }));
app.get('/api/personality', (_request, response) => response.json(personality));
app.get('/api/progression', (_request, response) => response.json(getProgression()));
app.get('/api/quests', (_request, response) => response.json(getQuests()));
app.get('/api/skills', (_request, response) => response.json(getSkills()));
app.get('/api/memories', (_request, response) => response.json(getMemories()));
app.post('/api/memories', (request, response) => {
  const content = typeof request.body?.content === 'string' ? request.body.content.trim() : '';
  if (!content || content.length > 500) return response.status(400).json({ error: 'Memory wajib diisi dan maksimal 500 karakter.' });
  const result = database.prepare('INSERT INTO memories (content) VALUES (?)').run(content);
  return response.status(201).json({ id: result.lastInsertRowid, content });
});
app.delete('/api/memories/:id', (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id)) return response.status(400).json({ error: 'ID memory tidak valid.' });
  const result = database.prepare('DELETE FROM memories WHERE id = ?').run(id);
  if (!result.changes) return response.status(404).json({ error: 'Memory tidak ditemukan.' });
  return response.status(204).end();
});
app.post('/api/chat', async (request, response) => {
  const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';
  if (!message || message.length > 4000) return response.status(400).json({ error: 'Pesan wajib diisi dan maksimal 4000 karakter.' });
  database.prepare('INSERT INTO messages (role, content) VALUES (?, ?)').run('user', message);
  let reply;
  let mode = 'demo';
  const emotion = emotionForMessage(message);
  try {
    reply = providerConfigured() ? await providerReply(message, request.body?.history) : demoReply(message);
    mode = providerConfigured() ? 'provider' : 'demo';
  } catch (error) {
    console.error('AI provider request failed:', error.message);
    const providerError = error.message.includes('401')
      ? 'API key ditolak provider (401). Periksa AI_API_KEY, AI_API_URL, dan model di file .env.'
      : error.message.includes('429')
        ? 'Provider menolak request (429). Periksa billing, saldo credits, atau batas rate akun API.'
        : 'AI provider sedang tidak tersedia. Periksa konfigurasi provider lalu coba lagi.';
    return response.status(502).json({ error: providerError });
  }
  const updateProgress = database.transaction(() => {
    database.prepare('INSERT INTO messages (role, content) VALUES (?, ?)').run('assistant', reply);
    database.prepare('UPDATE progression SET xp = xp + ? WHERE id = 1').run(XP_PER_MESSAGE);

    const quest = database.prepare('SELECT id, progress, goal, completed, reward_xp AS rewardXp FROM quests WHERE completed = 0 ORDER BY goal ASC, id ASC LIMIT 1').get();
    if (quest) {
      const progress = Math.min(quest.progress + 1, quest.goal);
      const completed = progress >= quest.goal ? 1 : 0;
      database.prepare('UPDATE quests SET progress = ?, completed = ? WHERE id = ?').run(progress, completed, quest.id);
      if (completed) database.prepare('UPDATE progression SET xp = xp + ? WHERE id = 1').run(quest.rewardXp);
    }

    const userMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user'").get().count;
    const savedMemories = database.prepare('SELECT COUNT(*) AS count FROM memories').get().count;
    const completedQuests = database.prepare('SELECT COUNT(*) AS count FROM quests WHERE completed = 1').get().count;
    const longMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user' AND length(content) >= 120").get().count;
    const questionMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user' AND content LIKE '%?%'").get().count;
    const topicMessages = database.prepare("SELECT COUNT(*) AS count FROM messages WHERE role = 'user' AND (lower(content) LIKE '%ai%' OR lower(content) LIKE '%belajar%' OR lower(content) LIKE '%proyek%' OR lower(content) LIKE '%rencana%')").get().count;
    const level = Math.floor(database.prepare('SELECT xp FROM progression WHERE id = 1').get().xp / XP_PER_LEVEL) + 1;
    const metrics = {
      messages: userMessages,
      memories: savedMemories,
      'first-signal': userMessages,
      'active-listener': userMessages,
      'curious-mind': userMessages,
      'deep-thinker': userMessages,
      'steady-progress': userMessages,
      'century-mind': userMessages,
      'memory-keeper': savedMemories,
      'memory-architect': savedMemories,
      'quest-beginner': completedQuests,
      'quest-master': completedQuests,
      longMessages,
      questionMessages,
      topicMessages,
      level
    };
    const achievements = database.prepare('SELECT id, progress, goal, unlocked, reward_xp AS rewardXp FROM achievements').all();
    for (const achievement of achievements) {
      const metric = metrics[achievement.id] ?? getAchievementSeriesMetric(achievement.id, metrics, achievement.progress);
      const progress = Math.min(Number.isFinite(Number(metric)) ? Number(metric) : 0, achievement.goal);
      const unlocked = progress >= achievement.goal ? 1 : 0;
      database.prepare('UPDATE achievements SET progress = ?, unlocked = ? WHERE id = ?').run(progress, unlocked, achievement.id);
      if (unlocked && !achievement.unlocked) database.prepare('UPDATE progression SET xp = xp + ? WHERE id = 1').run(achievement.rewardXp);
    }
  });
  updateProgress();
  return response.json({ reply, mode, emotion, memories: getMemories(), progression: getProgression(), quests: getQuests(), skills: getSkills() });
});
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Logic backend listening on port ${PORT}`);
});
