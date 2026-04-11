import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { getSocket, connectSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/ui';
import { Send, Paperclip } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { api.get('/messages').then(({ data }) => setConvos(data.conversations)).catch(() => {}); }, []);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    socket.on('message', (msg) => {
      if (msg.senderId === activeId) setMessages(prev => [...prev, msg]);
    });
    return () => { socket.off('message'); };
  }, [user, activeId]);

  useEffect(() => { if (activeId) { api.get(`/messages/${activeId}`).then(({ data }) => setMessages(data.messages)).catch(() => {}); } }, [activeId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    try {
      const { data } = await api.post(`/messages/${activeId}`, { content: text });
      setMessages(prev => [...prev, data.message]);
      setText('');
    } catch {}
  };

  return (
    <div style={{ paddingTop: 80, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', maxWidth: 1200, margin: '0 auto' }}>
        {/* Sidebar */}
        <div style={{ width: 340, borderRight: '1px solid var(--glass-border)', overflowY: 'auto', padding: '24px 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, padding: '0 24px', marginBottom: 24 }}>Сообщения</h2>
          {convos.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>Нет сообщений</div>
          ) : convos.map(c => (
            <button key={c.partner.id} onClick={() => setActiveId(c.partner.id)} style={{
              width: '100%', display: 'flex', gap: 12, padding: '14px 24px', textAlign: 'left',
              background: activeId === c.partner.id ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.2s',
            }}>
              <img src={c.partner.avatar} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--glass-border)' }} alt="" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{c.partner.displayName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage.content}</div>
              </div>
              {c.unread > 0 && <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'var(--bg)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}>{c.unread}</span>}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!activeId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 15 }}>Выберите диалог</div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map(m => (
                  <div key={m.id} style={{ alignSelf: m.senderId === user?.id ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{
                      padding: '12px 18px', borderRadius: 'var(--radius-md)',
                      background: m.senderId === user?.id ? 'var(--accent)' : 'var(--card)',
                      color: m.senderId === user?.id ? 'var(--bg)' : 'var(--text)',
                      fontSize: 14, lineHeight: 1.5,
                    }}>{m.content}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, textAlign: m.senderId === user?.id ? 'right' : 'left' }}>
                      {new Date(m.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 12 }}>
                <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Написать сообщение..." style={{ flex: 1 }} />
                <Button variant="primary" size="sm" onClick={send}><Send size={14} /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
