import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageCircle, Send, Settings2, Shield, Sword, Trophy, BookOpen, Plus } from 'lucide-react';
import './styles.css';

const starterMessages = [
  { role: 'assistant', content: 'Halo, aku Logic. Aku siap membantu kamu berpikir lebih jernih hari ini.' },
  { role: 'assistant', content: 'Ceritakan apa yang sedang ada di pikiranmu. Kita urai pelan-pelan.' }
];
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function BrainMark({ size = 18 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 4.5A3 3 0 0 0 6 7.3a3.2 3.2 0 0 0-1 5.8A3 3 0 0 0 7 18.5a3 3 0 0 0 4 1.2V6.5a3 3 0 0 0-1.5-2Z" /><path d="M14.5 4.5A3 3 0 0 1 18 7.3a3.2 3.2 0 0 1 1 5.8 3 3 0 0 1-2 5.4 3 3 0 0 1-4 1.2V6.5a3 3 0 0 1 1.5-2Z" /><path d="M7.5 9.5h2M7 14h2.5M14.5 9.5h2M14.5 14H17M12 6.5v13" /></svg>;
}

function App() {
  const [messages, setMessages] = React.useState(starterMessages);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeView, setActiveView] = React.useState('chat');
  const [memories, setMemories] = React.useState([]);
  const [personality, setPersonality] = React.useState(null);
  const [progression, setProgression] = React.useState({ xp: 0, level: 1, rank: 'Pemula', currentLevelXp: 0, nextLevelXp: 100, xpPerMessage: 10, stats: { totalMessages: 0 } });
  const [quests, setQuests] = React.useState([]);

  const activeQuest = React.useMemo(
    () => quests.find((quest) => !quest.completed) ?? quests[0] ?? null,
    [quests]
  );

  React.useEffect(() => {
    async function loadAppData() {
      try {
        const [personalityResponse, memoriesResponse, progressionResponse, questsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/personality`),
          fetch(`${API_BASE}/api/memories`),
          fetch(`${API_BASE}/api/progression`),
          fetch(`${API_BASE}/api/quests`)
        ]);

        if (personalityResponse.ok) setPersonality(await personalityResponse.json());
        else setPersonality(null);

        if (memoriesResponse.ok) setMemories(await memoriesResponse.json());
        else setMemories([]);

        if (progressionResponse.ok) setProgression(await progressionResponse.json());

        if (questsResponse.ok) {
          const nextQuests = await questsResponse.json();
          setQuests(nextQuests);
        }
      } catch {
        setPersonality(null);
        setMemories([]);
        setProgression({ xp: 0, level: 1, rank: 'Pemula', currentLevelXp: 0, nextLevelXp: 100, xpPerMessage: 10, stats: { totalMessages: 0 } });
        setQuests([]);
      }
    }

    loadAppData();
  }, []);

  async function sendMessage(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const requestHistory = [...messages].slice(-12);
    setInput('');
    setError('');
    setMessages((current) => [...current, { role: 'user', content }]);
    setLoading(true);
    try {
      const response = await fetch('https://vein-flashy-dog.abasthan.app/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: messages })
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(failure?.error || 'Server belum merespons dengan baik.');
      }
      const data = await response.json();
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }]);
      if (data.progression) setProgression(data.progression);
      if (data.quests) setQuests(data.quests);
    } catch (requestError) {
      setError(requestError.message);
      setMessages((current) => [...current, { role: 'assistant', content: 'Aku sedang tidak bisa terhubung ke server. Coba nyalakan backend lalu kirim pesan lagi.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><BrainMark size={18} /></span><span>LOGIC</span></div>
        <div className="hero-avatar"><div className="avatar-aura" /><img className="hero-avatar-photo" src="/Logic/avatar.jpeg" alt="Avatar pemilik Logic" /><span>GUARDIAN OF THOUGHTS</span></div>
        <div className="character-name">Logic</div>
        <div className="character-title">Assistant yang Sakti</div>
        <div className="level-row"><span>LV. {String(progression.level || 1).padStart(2, '0')}</span><strong>{progression.xp || 0} XP</strong></div>
        <div className="xp-track"><span style={{ width: `${Math.min(((progression.currentLevelXp || 0) / (progression.nextLevelXp || 100)) * 100, 100)}%` }} /></div>
        <div className="stat-grid"><div><Shield size={15} /><span>FOCUS</span><strong>{Math.min(99, 70 + (progression.level || 1) * 2)}</strong></div><div><Sword size={15} /><span>INSIGHT</span><strong>{Math.min(99, 65 + (progression.level || 1) * 3)}</strong></div></div>
        <button className="new-chat" onClick={() => setMessages(starterMessages)}><Plus size={16} /> Percakapan baru</button>
        <div className="side-label">MENU</div>
        <button className={`side-item${activeView === 'chat' ? ' active' : ''}`} onClick={() => setActiveView('chat')}><MessageCircle size={16} /> Ruang utama</button>
        <button className={`side-item${activeView === 'memory' ? ' active' : ''}`} onClick={() => setActiveView('memory')}><BookOpen size={16} /> Codex memory</button>
        <button className={`side-item${activeView === 'achievements' ? ' active' : ''}`} onClick={() => setActiveView('achievements')}><Trophy size={16} /> Achievements</button>
        <div className="sidebar-bottom"><div className="status-dot" /> ONLINE <Settings2 size={15} /></div>
      </aside>

      <section className="conversation">
        <header className="topbar"><div><span className="eyebrow">CHAPTER 01 / {activeView === 'chat' ? 'RUANG UTAMA' : activeView === 'memory' ? 'CODEX MEMORY' : 'ACHIEVEMENTS'}</span><h1>{activeView === 'chat' ? 'Teman berpikir yang hadir.' : activeView === 'memory' ? 'Catatan yang kamu pilih untuk diingat.' : 'Jejak perjalananmu.'}</h1><p className="topbar-subtitle">{activeView === 'chat' ? (personality ? `${personality.name} · fakta di atas drama.` : 'Satu pikiran pada satu waktu.') : activeView === 'memory' ? 'Memory hanya tersimpan atas izinmu.' : 'Setiap langkah kecil tetap berarti.'}</p><div className="level-pill">LEVEL {progression.level || 1} · {progression.rank || 'Pemula'}</div></div><div className="online-status"><span /> SERVER ONLINE</div></header>
        {activeView === 'chat' ? <div className="message-list">
          <div className="welcome"><div className="welcome-icon"><BrainMark size={21} /></div><div><span className="quest-label">NEW ADVENTURE</span><strong>Selamat datang di Logic</strong><p>Mulai dari satu kalimat. Kita ubah menjadi langkah yang terasa mungkin.</p></div></div>
          <div className="quest-banner"><div><span className="quest-label">ACTIVE QUEST</span><strong>{activeQuest?.title || 'Mulai tiga percakapan'}</strong><p>{activeQuest?.description || 'Buka ruang pikirmu lewat tiga pesan.'}</p></div><div className="quest-count">{String(activeQuest?.progress || 0).padStart(2, '0')}<small> / {String(activeQuest?.goal || 3).padStart(2, '0')}</small><span>{activeQuest?.completed ? 'COMPLETED' : 'IN PROGRESS'}</span></div></div>
          {messages.map((message, index) => <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}><div className="avatar">{message.role === 'assistant' ? <img src="/Logic/avatar.jpeg" alt="" /> : 'K'}</div><div className="message-bubble"><span className="message-label">{message.role === 'assistant' ? 'LOGIC' : 'KAMU'} <small>09:4{index}</small></span>{message.role === 'assistant' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown> : <p>{message.content}</p>}</div></div>)}
          {loading && <div className="message-row assistant"><div className="avatar"><img src="/Logic/avatar.jpeg" alt="" /></div><div className="message-bubble typing"><span /><span /><span /></div></div>}
        </div> : <div className="content-panel">{activeView === 'memory' ? <><div className="panel-heading"><BookOpen size={21} /><span>CODEX MEMORY</span></div><p className="panel-intro">Informasi yang kamu simpan secara sadar untuk membantu Logic memahami konteksmu.</p>{memories.length ? memories.map((memory) => <div className="codex-entry" key={memory.id}><span>✦</span><p>{memory.content}</p></div>) : <div className="empty-panel">Belum ada memory tersimpan.</div>}</> : <><div className="panel-heading"><Trophy size={21} /><span>ACHIEVEMENTS</span></div><div className="achievement-row"><div><strong>Pendengar aktif</strong><p>Hadir dalam lima percakapan.</p></div><b>TERBUKA</b></div><div className="achievement-row"><div><strong>Mulai tiga percakapan</strong><p>Buka ruang pikirmu lewat tiga pesan.</p></div><b>SELESAI</b></div></>}</div>}
        {activeView === 'chat' && <form className="composer" onSubmit={sendMessage}><div className="composer-inner"><span className="composer-rune"><BrainMark size={16} /></span><textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tulis pesan untuk memulai..." rows="1" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} /><button aria-label="Kirim pesan" title="Kirim pesan" disabled={!input.trim() || loading}><Send size={17} /></button></div><div className="composer-note">SHIFT + ENTER untuk baris baru <span>•</span> LOGIC siap mendengarkan</div>{error && <div className="error-note">{error}</div>}</form>}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
