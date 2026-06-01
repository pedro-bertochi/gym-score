import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIGURAÇÃO DA API ──────────────────────────────────────────────────────
const API_URL = "http://localhost:8080/api";

// Helper para fazer as requisições já com o token JWT injetado
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("jwt_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || data.error || "Erro na requisição");
  }
  return data;
}

// ─── TOKENS & CSS (Mantido exatamente como o seu original) ────────────────────
const T = {
  bg: "#060608", surface: "#0e0e14", card: "#13131c", cardHover: "#181824",
  border: "#1c1c2e", borderHot: "#2a2a42", accent: "#00ff88", accentDim: "#00ff8812",
  accentMid: "#00ff8840", gold: "#ffc533", goldDim: "#ffc53312", red: "#ff3b5c",
  redDim: "#ff3b5c12", blue: "#4f8cff", blueDim: "#4f8cff12", orange: "#ff6b35",
  muted: "#3a3a55", sub: "#6b6b8a", text: "#e4e4f0", textDim: "#9090b0",
};

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;overflow-x:hidden;}
body{background:#060608;color:#e4e4f0;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#1c1c2e;border-radius:2px;}
button{font-family:'DM Sans',sans-serif;cursor:pointer;border:none;outline:none;}
input,select,textarea{font-family:'DM Sans',sans-serif;outline:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes slideInRight{from{transform:translateX(32px);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes pulse2{0%,100%{opacity:1;}50%{opacity:.35;}}
@keyframes countUp{from{transform:scale(.8);opacity:0;}to{transform:scale(1);opacity:1;}}
@keyframes matchFound{0%{transform:scale(.6);opacity:0;}60%{transform:scale(1.08);}100%{transform:scale(1);opacity:1;}}
@keyframes glitch{0%,100%{transform:translateX(0);}33%{transform:translateX(-2px);}66%{transform:translateX(2px);}}
@keyframes onlinePing{0%{transform:scale(1);opacity:1;}100%{transform:scale(2.5);opacity:0;}}
@keyframes mmPulse{0%,100%{box-shadow:0 0 0 0 #00ff8844;}50%{box-shadow:0 0 0 16px transparent;}}
.app-shell{min-height:100vh;display:flex;flex-direction:column;}
.topbar{height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:#0e0e14;border-bottom:1px solid #1c1c2e;position:sticky;top:0;z-index:200;}
.topbar-logo{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:3px;color:#00ff88;}
.topbar-right{display:flex;align-items:center;gap:12px;}
.topbar-nav{display:flex;align-items:center;gap:2px;}
.tn-item{padding:6px 16px;border-radius:6px;font-size:13px;font-weight:600;color:#6b6b8a;background:transparent;border:1px solid transparent;transition:all .15s;cursor:pointer;}
.tn-item:hover{color:#e4e4f0;background:#13131c;}
.tn-item.active{color:#00ff88;background:#00ff8812;border-color:#00ff8840;}
.profile-btn{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#00ff88,#00ccff);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#000;cursor:pointer;border:2px solid transparent;transition:all .2s;flex-shrink:0;position:relative;}
.profile-btn:hover{border-color:#00ff88;box-shadow:0 0 16px #00ff8866;}
.profile-menu{position:absolute;top:calc(100% + 10px);right:0;background:#13131c;border:1px solid #1c1c2e;border-radius:12px;padding:8px;min-width:210px;z-index:300;animation:fadeIn .15s;}
.pm-item{padding:10px 14px;border-radius:8px;font-size:13px;color:#9090b0;cursor:pointer;display:flex;align-items:center;gap:10px;transition:all .15s;}
.pm-item:hover{background:#1c1c2e;color:#e4e4f0;}
.pm-item.danger{color:#ff3b5c;}
.pm-item.danger:hover{background:#ff3b5c12;}
.pm-divider{height:1px;background:#1c1c2e;margin:6px 0;}
.page{padding:32px;max-width:1280px;margin:0 auto;width:100%;animation:fadeUp .25s ease;}
.page-title{font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:2px;line-height:1;}
.page-sub{font-size:14px;color:#6b6b8a;margin-top:6px;}
.card{background:#13131c;border:1px solid #1c1c2e;border-radius:14px;padding:24px;transition:border-color .2s;}
.card:hover{border-color:#2a2a42;}
.card-title{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#3a3a55;margin-bottom:18px;display:flex;align-items:center;gap:8px;}
.card-title::before{content:'';width:3px;height:14px;background:#00ff88;border-radius:2px;}
.challenge-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:32px;}
.ch-card{background:#13131c;border:1px solid #1c1c2e;border-radius:16px;overflow:hidden;cursor:pointer;transition:all .2s;position:relative;}
.ch-card:hover{transform:translateY(-4px);border-color:#00ff8855;}
.ch-card.sel{border-color:#00ff88;box-shadow:0 0 32px #00ff8822,0 0 0 1px #00ff88;}
.ch-header{padding:28px 24px 20px;position:relative;}
.ch-icon{font-size:52px;margin-bottom:12px;display:block;}
.ch-name{font-family:'Bebas Neue',sans-serif;font-size:34px;letter-spacing:1px;line-height:1;margin-bottom:4px;}
.ch-desc{font-size:12px;color:#6b6b8a;line-height:1.5;}
.ch-meta{padding:16px 24px;background:#060608;border-top:1px solid #1c1c2e;display:flex;align-items:center;justify-content:space-between;}
.ch-stat{text-align:center;}
.ch-stat-val{font-family:'DM Mono',monospace;font-size:18px;font-weight:500;}
.ch-stat-lbl{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b8a;margin-top:2px;}
.ch-accent{position:absolute;top:0;left:0;right:0;height:3px;}
.mm-arena{background:#13131c;border:1px solid #1c1c2e;border-radius:20px;padding:32px;text-align:center;position:relative;overflow:hidden;}
.mm-arena::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,#00ff8808,transparent 60%);pointer-events:none;}
.mm-players{display:flex;align-items:center;justify-content:center;gap:32px;position:relative;z-index:1;}
.mm-player{flex:1;max-width:200px;}
.mm-sep{display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 8px;}
.mm-vs{font-family:'Bebas Neue',sans-serif;font-size:28px;color:#3a3a55;}
.mm-searching{font-size:12px;color:#00ff88;animation:pulse2 1.2s infinite;letter-spacing:1px;}
.fight-screen{background:#060608;border:1px solid #1c1c2e;border-radius:20px;padding:32px;margin-top:20px;}
.fight-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}
.fight-timer{font-family:'Bebas Neue',sans-serif;font-size:28px;}
.fight-exercise{font-family:'Bebas Neue',sans-serif;font-size:48px;letter-spacing:1px;text-align:center;margin-bottom:8px;}
.fight-body{display:grid;grid-template-columns:1fr auto 1fr;gap:24px;align-items:center;}
.fight-score{font-family:'Bebas Neue',sans-serif;font-size:80px;line-height:1;}
.fight-score.me{color:#00ff88;}
.fight-score.opp{color:#ff6b35;}
.submit-rep-btn{width:100%;padding:18px;border-radius:12px;background:#00ff88;color:#000;font-size:18px;font-weight:700;letter-spacing:2px;transition:all .15s;margin-top:16px;font-family:'Barlow Condensed',sans-serif;}
.submit-rep-btn:hover{background:#00e87d;transform:translateY(-1px);box-shadow:0 8px 24px #00ff8844;}
.submit-rep-btn:active{transform:translateY(1px);}
.result-screen{text-align:center;padding:40px 0;}
.result-trophy{font-size:80px;margin-bottom:16px;animation:countUp .4s ease;}
.result-title{font-family:'Bebas Neue',sans-serif;font-size:56px;letter-spacing:2px;}
.leaderboard-row{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:10px;transition:background .1s;cursor:default;}
.leaderboard-row:hover{background:#1c1c2e44;}
.lb-rank{font-family:'DM Mono',monospace;font-size:13px;color:#3a3a55;width:24px;text-align:center;flex-shrink:0;}
.lb-rank.top{color:#ffc533;}
.lb-name{flex:1;font-size:14px;font-weight:500;}
.lb-score{font-family:'DM Mono',monospace;font-size:13px;color:#00ff88;flex-shrink:0;}
.online-list{display:flex;flex-wrap:wrap;gap:10px;}
.online-chip{display:flex;align-items:center;gap:8px;padding:7px 14px;background:#0e0e14;border:1px solid #1c1c2e;border-radius:30px;font-size:12px;font-weight:500;transition:all .15s;cursor:pointer;}
.online-chip:hover{border-color:#00ff88;color:#00ff88;}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:pulse2 1.5s infinite;margin-right:6px;flex-shrink:0;}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);animation:fadeIn .15s;}
.modal{background:#13131c;border:1px solid #1c1c2e;border-radius:20px;padding:36px;width:520px;max-width:96vw;max-height:92vh;overflow-y:auto;animation:fadeUp .2s ease;position:relative;}
.modal-close{position:absolute;top:20px;right:20px;background:#0e0e14;border:1px solid #1c1c2e;color:#6b6b8a;width:32px;height:32px;border-radius:8px;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;}
.modal-close:hover{color:#e4e4f0;border-color:#2a2a42;}
.form-label{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b6b8a;display:block;margin-bottom:6px;}
.form-input{width:100%;background:#060608;border:1px solid #1c1c2e;border-radius:8px;padding:10px 14px;font-size:14px;color:#e4e4f0;transition:border-color .15s;}
.form-input:focus{border-color:#00ff88;}
.form-input::placeholder{color:#3a3a55;}
.form-group{margin-bottom:16px;}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 20px;border-radius:9px;font-size:14px;font-weight:600;transition:all .15s;}
.btn-primary{background:#00ff88;color:#000;}
.btn-primary:hover{background:#00e87d;transform:translateY(-1px);}
.btn-outline{background:transparent;color:#e4e4f0;border:1px solid #1c1c2e;}
.btn-outline:hover{border-color:#00ff88;color:#00ff88;}
.btn-ghost{background:transparent;color:#6b6b8a;padding:8px 12px;}
.btn-ghost:hover{color:#e4e4f0;}
.btn-sm{padding:6px 14px;font-size:12px;}
.btn-lg{padding:14px 28px;font-size:16px;font-weight:700;letter-spacing:.5px;}
.btn-full{width:100%;}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;}
.badge-green{background:#00ff8812;color:#00ff88;border:1px solid #00ff8840;}
.badge-gold{background:#ffc53312;color:#ffc533;border:1px solid #ffc53333;}
.badge-red{background:#ff3b5c12;color:#ff3b5c;border:1px solid #ff3b5c33;}
.badge-blue{background:#4f8cff12;color:#4f8cff;border:1px solid #4f8cff33;}
.badge-orange{background:#ff6b3512;color:#ff6b35;border:1px solid #ff6b3533;}
.toast-wrap{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;}
.toast{background:#13131c;border:1px solid #1c1c2e;border-radius:12px;padding:14px 18px;font-size:13px;display:flex;align-items:center;gap:12px;animation:slideInRight .2s ease;box-shadow:0 12px 40px rgba(0,0,0,.5);min-width:260px;}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
.stat-card{background:#13131c;border:1px solid #1c1c2e;border-radius:12px;padding:18px 20px;position:relative;overflow:hidden;transition:all .2s;}
.stat-card:hover{border-color:#2a2a42;transform:translateY(-2px);}
.stat-lbl{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b8a;}
.stat-val{font-family:'Bebas Neue',sans-serif;font-size:40px;line-height:1;margin:4px 0;}
.stat-delta{font-size:11px;color:#00ff88;}
.stat-ico{position:absolute;right:14px;top:14px;font-size:26px;opacity:.1;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13px;}
thead th{padding:9px 14px;text-align:left;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#3a3a55;border-bottom:1px solid #1c1c2e;}
tbody tr{border-bottom:1px solid #1c1c2e22;transition:background .1s;}
tbody tr:hover{background:#1c1c2e22;}
tbody td{padding:11px 14px;}
.progress-bar{height:4px;background:#1c1c2e;border-radius:2px;overflow:hidden;}
.progress-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#00ff88,#4f8cff);}
.login-root{min-height:100vh;background:#060608;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.login-grid{position:absolute;inset:0;background-image:linear-gradient(#1c1c2e55 1px,transparent 1px),linear-gradient(90deg,#1c1c2e55 1px,transparent 1px);background-size:48px 48px;mask-image:radial-gradient(ellipse 70% 70% at 50% 50%,black 30%,transparent 80%);}
.login-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(#00ff880e,transparent 70%);left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;}
.login-card{position:relative;width:440px;background:#13131c;border:1px solid #1c1c2e;border-radius:22px;padding:52px 44px;}
.pix-qr-box{width:140px;height:140px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:72px;margin:0 auto 16px;box-shadow:0 0 40px #00ff8833;}
.pix-code-box{background:#060608;border:1px solid #1c1c2e;border-radius:8px;padding:10px 12px;font-family:'DM Mono',monospace;font-size:10px;color:#00ff88;word-break:break-all;cursor:pointer;margin-bottom:14px;}
.pix-status-box{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:10px;font-weight:600;}
.queue-card{background:#0e0e14;border:1px solid #1c1c2e;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all .2s;}
.queue-card:hover{border-color:#00ff8844;}
.queue-timer{font-family:'DM Mono',monospace;font-size:11px;color:#6b6b8a;}
.online-ping{position:relative;display:inline-block;width:10px;height:10px;}
.online-ping::after{content:'';position:absolute;inset:0;border-radius:50%;background:#00ff88;animation:onlinePing 1.5s infinite;}
.online-ping-core{width:10px;height:10px;border-radius:50%;background:#00ff88;display:block;}
.admin-sidebar-item{display:flex;align-items:center;gap:10px;border-radius:8px;padding:9px 12px;font-size:13px;font-weight:600;color:#6b6b8a;cursor:pointer;transition:all .15s;border:1px solid transparent;}
.admin-sidebar-item:hover{color:#e4e4f0;background:#13131c;}
.admin-sidebar-item.active{color:#00ff88;background:#00ff8812;border-color:#00ff8840;}
@media(max-width:768px){
  .challenge-grid{grid-template-columns:1fr;}
  .stats-row{grid-template-columns:1fr 1fr;}
  .page{padding:16px;}
  .fight-body{grid-template-columns:1fr;gap:12px;}
  .fight-score{font-size:56px;}
}
`;

// ─── DATA (Mantido igual ao original) ─────────────────────────────────────────
const EXERCISES = [
  { id: "flexao", name: "FLEXÃO", icon: "💪", desc: "Teste sua resistência de peito e tríceps", color: T.accent, muscles: "Peitoral · Tríceps · Deltóide", online: 12, record: 87, unit: "reps" },
  { id: "supino", name: "SUPINO", icon: "🏋️", desc: "Máximo de carga no supino livre", color: T.gold, muscles: "Peitoral · Ombros · Tríceps", online: 8, record: 142, unit: "kg" },
  { id: "agachamento", name: "AGACH. SUMÔ", icon: "🦵", desc: "Potência e explosão de pernas e glúteos", color: T.orange, muscles: "Quadríceps · Glúteos · Adutores", online: 15, record: 63, unit: "reps" },
];

const ONLINE_USERS = [
  { id: 1, name: "Lucas F.", initials: "LF", color: "#4f8cff", rating: 1842, wins: 34, status: "idle" },
  { id: 2, name: "Marina C.", initials: "MC", color: "#ff6b35", rating: 2101, wins: 58, status: "in_match" },
  { id: 3, name: "Beatriz L.", initials: "BL", color: "#a855f7", rating: 1955, wins: 41, status: "idle" },
  { id: 4, name: "Carlos E.", initials: "CE", color: "#ec4899", rating: 1677, wins: 19, status: "in_queue" },
  { id: 5, name: "Rafael S.", initials: "RS", color: "#22d3ee", rating: 1789, wins: 28, status: "idle" },
  { id: 6, name: "Ana P.", initials: "AP", color: "#f59e0b", rating: 2044, wins: 49, status: "in_match" },
];

const LEADERBOARD_DATA = {
  flexao: [{ name: "Marina C.", initials: "MC", color: "#ff6b35", score: 87, wins: 22 }, { name: "Beatriz L.", initials: "BL", color: "#a855f7", score: 81, wins: 18 }, { name: "Lucas F.", initials: "LF", color: "#4f8cff", score: 74, wins: 15 }, { name: "Ana P.", initials: "AP", color: "#f59e0b", score: 68, wins: 11 }, { name: "Você", initials: "AD", color: T.accent, score: 62, wins: 9, isMe: true }],
  supino: [{ name: "Carlos E.", initials: "CE", color: "#ec4899", score: 142, wins: 14 }, { name: "Lucas F.", initials: "LF", color: "#4f8cff", score: 135, wins: 12 }, { name: "Rafael S.", initials: "RS", color: "#22d3ee", score: 128, wins: 9 }, { name: "Você", initials: "AD", color: T.accent, score: 110, wins: 7, isMe: true }, { name: "Marina C.", initials: "MC", color: "#ff6b35", score: 95, wins: 5 }],
  agachamento: [{ name: "Beatriz L.", initials: "BL", color: "#a855f7", score: 63, wins: 19 }, { name: "Ana P.", initials: "AP", color: "#f59e0b", score: 58, wins: 16 }, { name: "Você", initials: "AD", color: T.accent, score: 52, wins: 12, isMe: true }, { name: "Rafael S.", initials: "RS", color: "#22d3ee", score: 47, wins: 8 }, { name: "Carlos E.", initials: "CE", color: "#ec4899", score: 41, wins: 5 }],
};

const MEMBERS_DATA = [
  { id: 1, name: "Lucas Ferreira", plan: "Premium", status: "Ativo", joined: "Jan 2025", checkins: 48, balance: 150 },
  { id: 2, name: "Ana Paula Silva", plan: "Básico", status: "Ativo", joined: "Mar 2025", checkins: 22, balance: 0 },
  { id: 3, name: "Carlos Eduardo", plan: "Premium", status: "Inativo", joined: "Nov 2024", checkins: 3, balance: -50 },
  { id: 4, name: "Marina Costa", plan: "Elite", status: "Ativo", joined: "Fev 2025", checkins: 61, balance: 300 },
  { id: 5, name: "Rafael Santos", plan: "Básico", status: "Pendente", joined: "Mai 2025", checkins: 0, balance: 0 },
  { id: 6, name: "Beatriz Lima", plan: "Elite", status: "Ativo", joined: "Jan 2025", checkins: 55, balance: 200 },
];

const PAYMENTS = [
  { id: "TXN001", member: "Marina Costa", valor: 300, status: "PAGO", data: "10/05" },
  { id: "TXN002", member: "Lucas Ferreira", valor: 150, status: "PAGO", data: "09/05" },
  { id: "TXN003", member: "Rafael Santos", valor: 80, status: "PENDENTE", data: "10/05" },
  { id: "TXN004", member: "Carlos Eduardo", valor: 50, status: "FALHOU", data: "08/05" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((icon, msg) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, icon, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, add };
}

function Av({ initials, color, size = 36, sx = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}cc, ${color}66)`,
      border: `2px solid ${color}66`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.34, color: "#fff", flexShrink: 0, ...sx
    }}>{initials}</div>
  );
}

function Bdg({ type, children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

// ─── LOGIN COM INTEGRAÇÃO GO ──────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      // Fazendo a requisição real para o backend
      const res = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          senha: form.password
        })
      });

      // Salva o token retornado pelo Go no LocalStorage
      localStorage.setItem("jwt_token", res.data.token);
      
      // Passa os dados do usuário pro front principal
      onLogin(res.data.usuario);
      
    } catch (err) {
      alert("Falha no login: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-grid" />
      <div className="login-glow" />
      <div className="login-card" style={{ animation: "fadeUp .3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 54, letterSpacing: 4, color: T.accent, lineHeight: 1 }}>GYMSCORE</div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: T.muted, textTransform: "uppercase", marginTop: 4 }}>Desafie · Supere · Domine</div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="seu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Senha</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <button className="btn btn-primary btn-full btn-lg" style={{ marginTop: 4 }} onClick={handle} disabled={loading}>
          {loading ? "Autenticando..." : "Entrar na Arena →"}
        </button>
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: T.muted }}>Go · Fiber v2 · JWT · GORM</div>
      </div>
    </div>
  );
}

// ─── MATCHMAKING MODAL ────────────────────────────────────────────────────────
function MatchmakingModal({ exercise, onClose, onMatchFound }) {
  const [phase, setPhase] = useState("searching");
  const [opponent, setOpponent] = useState(null);
  const [dots, setDots] = useState(".");
  const [queueTime, setQueueTime] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400);
    const qt = setInterval(() => setQueueTime(t => t + 1), 1000);
    const t = setTimeout(() => {
      const idleUsers = ONLINE_USERS.filter(u => u.status === "idle");
      const opp = idleUsers[Math.floor(Math.random() * idleUsers.length)];
      setOpponent(opp);
      setPhase("found");
      clearInterval(iv);
      clearInterval(qt);
    }, 2000 + Math.random() * 1500);
    return () => { clearInterval(iv); clearInterval(qt); clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (phase === "found" && opponent) {
      const t = setTimeout(() => onMatchFound(opponent), 2200);
      return () => clearTimeout(t);
    }
  }, [phase, opponent]);

  const queueUsers = ONLINE_USERS.filter(u => u.status === "in_queue");

  return (
    <div className="modal-bg">
      <div className="modal" style={{ textAlign: "center", maxWidth: 560 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, letterSpacing: 2, marginBottom: 6 }}>{exercise.icon} {exercise.name}</div>
        <div style={{ fontSize: 12, color: T.sub, marginBottom: 28 }}>
          {phase === "searching" ? `Buscando adversário com rank similar${dots}` : "⚡ ADVERSÁRIO ENCONTRADO!"}
        </div>

        <div className="mm-arena" style={{ marginBottom: 20 }}>
          <div className="mm-players">
            <div className="mm-player">
              <Av initials="AD" color={T.accent} size={68} sx={{ margin: "0 auto 12px", boxShadow: `0 0 24px ${T.accent}44`, animation: phase === "found" ? "mmPulse 1s ease" : "none" }} />
              <div style={{ fontWeight: 700, fontSize: 15 }}>Você</div>
              <div style={{ fontSize: 11, color: T.sub }}>Rating: 1.820</div>
            </div>
            <div className="mm-sep">
              <div className="mm-vs" style={{ fontSize: phase === "found" ? 36 : 28, color: phase === "found" ? T.red : T.muted, animation: phase === "found" ? "glitch .3s ease" : "none" }}>VS</div>
              {phase === "searching" && <div className="mm-searching">BUSCANDO{dots}</div>}
            </div>
            <div className="mm-player">
              {phase === "searching" ? (
                <>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", background: T.surface, border: `2px dashed ${T.muted}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px", animation: "pulse2 1.5s infinite" }}>?</div>
                  <div style={{ color: T.muted, fontWeight: 700 }}>???</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Aguardando</div>
                </>
              ) : opponent ? (
                <div style={{ animation: "matchFound .4s ease" }}>
                  <Av initials={opponent.initials} color={opponent.color} size={68} sx={{ margin: "0 auto 12px", boxShadow: `0 0 24px ${opponent.color}44` }} />
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{opponent.name}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>Rating: {opponent.rating}</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        
        {phase === "searching" && <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={onClose}>Cancelar busca</button>}
      </div>
    </div>
  );
}

// ─── FIGHT SCREEN ─────────────────────────────────────────────────────────────
function FightScreen({ exercise, opponent, onFinish }) {
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [phase, setPhase] = useState("fight");
  const [winner, setWinner] = useState(null);
  const [pressed, setPressed] = useState(false);
  const [supinoInput, setSupinoInput] = useState("");
  const [showSupinoInput, setShowSupinoInput] = useState(false);
  const myScoreRef = useRef(0);
  const oppScoreRef = useRef(0);

  useEffect(() => {
    if (phase !== "fight") return;
    const iv = setInterval(() => {
      const rate = exercise.id === "supino" ? 0.35 : 0.65;
      if (Math.random() < rate) {
        const inc = exercise.id === "supino" ? Math.floor(Math.random() * 10 + 3) : 1;
        setOppScore(s => { oppScoreRef.current = s + inc; return s + inc; });
      }
    }, 1300 + Math.random() * 700);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fight") return;
    if (timeLeft <= 0) {
      setPhase("result");
      setWinner(myScoreRef.current >= oppScoreRef.current ? "me" : "opp");
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, phase]);

  const addRep = () => {
    if (phase !== "fight") return;
    setPressed(true);
    setTimeout(() => setPressed(false), 110);
    if (exercise.id === "supino") setShowSupinoInput(true);
    else setMyScore(s => { myScoreRef.current = s + 1; return s + 1; });
  };

  const confirmSupino = () => {
    const val = parseInt(supinoInput || "0");
    if (val > 0) { myScoreRef.current = Math.max(myScoreRef.current, val); setMyScore(myScoreRef.current); }
    setSupinoInput("");
    setShowSupinoInput(false);
  };

  if (phase === "result") {
    const won = winner === "me";
    return (
      <div className="fight-screen">
        <div className="result-screen">
          <div className="result-trophy">{won ? "🏆" : "💀"}</div>
          <div className="result-title" style={{ color: won ? T.accent : T.red }}>{won ? "VITÓRIA!" : "DERROTA"}</div>
          <button className="btn btn-primary btn-lg" onClick={onFinish} style={{marginTop: 20}}>← Voltar aos Desafios</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fight-screen">
      {showSupinoInput && (
        <div className="modal-bg" onClick={() => setShowSupinoInput(false)}>
          <div className="modal" style={{ width: 320, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 16 }}>⚡ REGISTRAR CARGA</div>
            <input className="form-input" type="number" placeholder="Ex: 80" value={supinoInput} onChange={e => setSupinoInput(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmSupino()} autoFocus style={{ textAlign: "center", fontSize: 28, fontFamily: "'DM Mono',monospace", marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowSupinoInput(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmSupino}>Confirmar →</button>
            </div>
          </div>
        </div>
      )}

      <div className="fight-header">
        <div>
          <div style={{ fontSize: 11, color: T.sub, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Em disputa</div>
          <div className="fight-exercise">{exercise.icon} {exercise.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="fight-timer" style={{ color: timeLeft <= 15 ? T.red : T.gold }}>{String(timeLeft).padStart(2, "0")}s</div>
        </div>
      </div>
      <div className="fight-body">
        <div style={{ textAlign: "center" }}>
          <Av initials="AD" color={T.accent} size={52} sx={{ margin: "0 auto 10px" }} />
          <div className="fight-score me" key={myScore}>{myScore}</div>
        </div>
        <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: T.muted }}>VS</div></div>
        <div style={{ textAlign: "center" }}>
          <Av initials={opponent.initials} color={opponent.color} size={52} sx={{ margin: "0 auto 10px" }} />
          <div className="fight-score opp" key={oppScore}>{oppScore}</div>
        </div>
      </div>
      <button className="submit-rep-btn" onClick={addRep} style={{ transform: pressed ? "scale(.97)" : "scale(1)", transition: "transform .1s" }}>
        {exercise.id === "supino" ? "⚡ REGISTRAR CARGA" : `💪 +1 ${exercise.unit.toUpperCase()}`}
      </button>
    </div>
  );
}

// ─── CHALLENGES PAGE ──────────────────────────────────────────────────────────
function ChallengesPage({ toastAdd, loggedUser }) {
  const [selectedEx, setSelectedEx] = useState(null);
  const [matchmaking, setMatchmaking] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [fighting, setFighting] = useState(false);
  const [lbEx, setLbEx] = useState("flexao");
  const [onlineUsers, setOnlineUsers] = useState(ONLINE_USERS);

  // Exemplo de como você vai puxar os Desafios Reais da API do Go no futuro:
  useEffect(() => {
    async function loadDesafiosReais() {
      try {
        const res = await apiFetch("/desafios/view");
        console.log("Desafios da API Go carregados:", res.data);
        // Quando for a hora, você pode substituir EXERCISES pelo res.data
      } catch (err) {
        console.warn("API de desafios não configurada ou vazia:", err.message);
      }
    }
    loadDesafiosReais();
  }, []);

  const startMatch = (ex) => { setSelectedEx(ex); setMatchmaking(true); };
  const onMatchFound = (opp) => { setMatchmaking(false); setOpponent(opp); setFighting(true); };
  const onFinish = () => { toastAdd("🏆", "Partida registrada! Ranking atualizado."); setFighting(false); setSelectedEx(null); setOpponent(null); };

  if (fighting && selectedEx && opponent) {
    return <div className="page"><FightScreen exercise={selectedEx} opponent={opponent} onFinish={onFinish} /></div>;
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
        <div>
          <div className="page-title">ARENA DE DESAFIOS</div>
          <div className="page-sub"><span className="live-dot" />{onlineUsers.length} atletas online · Matchmaking ativo</div>
        </div>
      </div>

      <div className="challenge-grid">
        {EXERCISES.map((ex) => (
          <div key={ex.id} className={`ch-card ${selectedEx?.id === ex.id ? "sel" : ""}`} onClick={() => setSelectedEx(ex)}>
            <div className="ch-accent" style={{ background: ex.color }} />
            <div className="ch-header">
              <span className="ch-icon">{ex.icon}</span>
              <div className="ch-name" style={{ color: ex.color }}>{ex.name}</div>
              <div className="ch-desc">{ex.desc}</div>
              <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>{ex.muscles}</div>
            </div>
            <div className="ch-meta">
              <button className="btn btn-sm" style={{ background: ex.color, color: "#000", fontWeight: 700 }} onClick={e => { e.stopPropagation(); startMatch(ex); }}>JOGAR →</button>
            </div>
          </div>
        ))}
      </div>
      {matchmaking && selectedEx && (
        <MatchmakingModal exercise={selectedEx} onClose={() => { setMatchmaking(false); setSelectedEx(null); }} onMatchFound={onMatchFound} />
      )}
    </div>
  );
}

// ─── MY RANKING PAGE ──────────────────────────────────────────────────────────
function MyRankingPage({ loggedUser }) {
  return (
    <div className="page">
      <div style={{ marginBottom: 32 }}>
        <div className="page-title">MEU RANKING</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24, background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 28 }}>
        <Av initials={loggedUser?.nome?.substring(0,2).toUpperCase() || "AD"} color={T.accent} size={72} sx={{ boxShadow: `0 0 24px ${T.accent}44` }} />
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1 }}>{loggedUser?.nome} {loggedUser?.sobrenome}</div>
          <div style={{ color: T.sub, fontSize: 13, marginBottom: 10 }}>Saldo atual: R$ {parseFloat(loggedUser?.saldo || 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── PIX MODAL INTEGRADO COM O GO ─────────────────────────────────────────────
function PixModal({ onClose, toastAdd, loggedUser }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ valor: "", cpf: loggedUser?.cpf || "" });
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null); // Vai receber a resposta do backend

  const gen = async () => {
    setLoading(true);
    try {
      // Fazendo a requisição real de PIX para o seu backend Go
      const res = await apiFetch("/pagamento/pix", {
        method: "POST",
        body: JSON.stringify({
          id_usuario: loggedUser.id,
          valor: parseFloat(form.valor),
          cpf: form.cpf
        })
      });

      // res.data deve conter o QRCodeBase64, Payload, e o ID do Asaas
      setPixData(res.data);
      setStep("qr");
      toastAdd("💸", "Cobrança PIX gerada com sucesso!");
    } catch (err) {
      alert("Erro ao gerar PIX: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => { 
    navigator.clipboard?.writeText(pixData.payload); 
    toastAdd("📋", "Código copiado!"); 
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 560 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, marginBottom: 4 }}>💸 Pagamento PIX</div>
        <div style={{ fontSize: 13, color: T.sub, marginBottom: 24 }}>Adicione saldo à sua conta via PIX</div>

        {step === "form" && <>
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input className="form-input" type="number" placeholder="Ex: 50.00" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">CPF (Obrigatório para o Asaas)</label>
            <input className="form-input" placeholder="12345678909" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} />
          </div>
          
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={gen} disabled={loading || !form.valor || !form.cpf}>
              {loading ? "Processando API..." : "Gerar QR →"}
            </button>
          </div>
        </>}

        {step === "qr" && pixData && <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>Asaas ID: <span style={{ fontFamily: "DM Mono", color: T.accent }}>{pixData.asaas_payment_id}</span></div>
            
            {/* O Backend retorna o Base64 do QR Code gerado pelo Asaas */}
            <img 
              src={`data:image/png;base64,${pixData.qrcode_base64}`} 
              alt="QR Code Pix" 
              style={{ width: 200, height: 200, borderRadius: 10, border: `2px solid ${T.accent}`, marginBottom: 16 }} 
            />

            <div style={{ fontFamily: "DM Mono", fontSize: 22, color: T.gold, marginBottom: 12, fontWeight: 700 }}>
              R$ {parseFloat(form.valor).toFixed(2)}
            </div>
            
            <div className="pix-code-box" onClick={copy}>
              {pixData.payload.substring(0, 72)}...
              <span style={{ display: "block", color: T.muted, fontSize: 9, marginTop: 4 }}>📋 Clique para copiar o Payload (Copia e Cola)</span>
            </div>
            <div className="pix-status-box" style={{ background: T.goldDim, color: T.gold, border: `1px solid ${T.gold}33`, marginBottom: 20 }}>⏳ Aguardando confirmação do Asaas (Webhook)...</div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn btn-outline" onClick={onClose}>Fechar (Aguardar Webhook)</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD (Pode ficar exatamente igual) ────────────────────────────
function AdminDashboard({ toastAdd, onPixOpen, onClose, loggedUser }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 400, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ background: T.surface, padding: 40, borderRadius: 10, border: `1px solid ${T.border}` }}>
         <h2>Painel Admin Simplificado</h2>
         <p>Olá, {loggedUser?.nome}</p>
         <button className="btn btn-outline" onClick={onClose} style={{marginTop: 20}}>Fechar Painel</button>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ page, setPage, showAdmin, setShowAdmin, toastAdd, loggedUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const initials = loggedUser ? loggedUser.nome?.substring(0,2).toUpperCase() : "?";

  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div className="topbar-logo">GYMSCORE</div>
        <nav className="topbar-nav">
          <div className={`tn-item ${page === "challenges" ? "active" : ""}`} onClick={() => setPage("challenges")}>🏆 Desafios</div>
          <div className={`tn-item ${page === "ranking" ? "active" : ""}`} onClick={() => setPage("ranking")}>📊 Meu Ranking</div>
        </nav>
      </div>
      <div className="topbar-right">
        <div style={{ fontSize: 12, color: T.muted }}><span className="live-dot" />Saldo: R$ {parseFloat(loggedUser?.saldo || 0).toFixed(2)}</div>
        <div style={{ position: "relative" }}>
          <div className="profile-btn" onClick={() => setOpen(o => !o)}>{initials}</div>
          {open && (
            <div className="profile-menu">
              <div style={{ padding: "10px 14px 12px", borderBottom: `1px solid ${T.border}`, marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{loggedUser?.nome} {loggedUser?.sobrenome}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{loggedUser?.email}</div>
              </div>
              <div className="pm-item danger" onClick={() => { onLogout(); setOpen(false); }}>🚪 Sair</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [page, setPage] = useState("challenges");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const { toasts, add: toastAdd } = useToast();

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    
    // Tenta autologin se já tiver token
    const token = localStorage.getItem("jwt_token");
    if (token) {
      // O ideal aqui seria chamar uma rota tipo /api/usuarios/me para validar o token
      // Como não achei uma rota /me no seu código, vou pedir login manual se der refresh.
      localStorage.removeItem("jwt_token");
    }
    
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  const handleLogin = (userData) => {
    setLoggedUser(userData);
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setAuthed(false);
    setLoggedUser(null);
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      <Topbar
        page={page}
        setPage={setPage}
        showAdmin={showAdmin}
        setShowAdmin={setShowAdmin}
        toastAdd={toastAdd}
        loggedUser={loggedUser}
        onLogout={handleLogout}
      />

      {/* Botão flutuante para recarga rápida via PIX */}
      <button 
         className="btn btn-primary" 
         style={{ position: "fixed", bottom: 20, left: 20, zIndex: 100, borderRadius: 50, padding: "14px 24px" }}
         onClick={() => setShowPix(true)}
      >
         💸 Adicionar Saldo PIX
      </button>

      {page === "challenges" ? <ChallengesPage toastAdd={toastAdd} loggedUser={loggedUser} /> : <MyRankingPage loggedUser={loggedUser} />}

      {showPix && <PixModal onClose={() => setShowPix(false)} toastAdd={toastAdd} loggedUser={loggedUser} />}

      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast"><span style={{ fontSize: 18 }}>{t.icon}</span><span>{t.msg}</span></div>
        ))}
      </div>
    </div>
  );
}
