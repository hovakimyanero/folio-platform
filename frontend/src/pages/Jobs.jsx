import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input, Textarea, Label, Button } from '../components/ui';
import { Plus, MapPin, Briefcase, DollarSign, Calendar, ExternalLink, Trash2 } from 'lucide-react';

const JOB_TYPES = { FULL_TIME: 'Полная занятость', PART_TIME: 'Частичная', FREELANCE: 'Фриланс', REMOTE: 'Удалённо' };

export default function Jobs() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', location: '', type: 'FULL_TIME', description: '', salary: '', contactEmail: '', contactUrl: '' });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.get('/jobs').then(({ data }) => setJobs(data.jobs)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePublish = async () => {
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) return showToast('Заполните обязательные поля', 'error');
    setPublishing(true);
    try {
      const { data } = await api.post('/jobs', form);
      setJobs(prev => [data.job, ...prev]);
      setForm({ title: '', company: '', location: '', type: 'FULL_TIME', description: '', salary: '', contactEmail: '', contactUrl: '' });
      setShowForm(false);
      showToast('Вакансия опубликована!', 'success');
    } catch { showToast('Ошибка публикации', 'error'); }
    finally { setPublishing(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить вакансию?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
      showToast('Вакансия удалена', 'success');
    } catch { showToast('Ошибка удаления', 'error'); }
  };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', margin: 0 }}>Вакансии</h1>
          {user && <Button variant="primary" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Разместить вакансию</Button>}
        </div>

        {showForm && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 32, marginBottom: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><Label>Должность *</Label><Input value={form.title} onChange={e => setField('title', e.target.value)} /></div>
              <div><Label>Компания *</Label><Input value={form.company} onChange={e => setField('company', e.target.value)} /></div>
              <div><Label>Локация</Label><Input value={form.location} onChange={e => setField('location', e.target.value)} placeholder="Москва / Удалённо" /></div>
              <div>
                <Label>Тип занятости</Label>
                <select className="rdx-input" value={form.type} onChange={e => setField('type', e.target.value)} style={{ cursor: 'pointer' }}>
                  {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><Label>Зарплата</Label><Input value={form.salary} onChange={e => setField('salary', e.target.value)} placeholder="от 100 000 ₽" /></div>
              <div><Label>Email для откликов</Label><Input type="email" value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 16 }}><Label>Описание вакансии *</Label><Textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={6} style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="primary" onClick={handlePublish} disabled={publishing}>{publishing ? 'Публикация...' : 'Опубликовать'}</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', paddingTop: 80 }}>Загрузка...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Пока нет вакансий</h3>
            <p className="empty-state-text">Разместите первую вакансию для дизайнеров!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map(job => (
              <div key={job.id} style={{ background: 'var(--card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{job.title}</h3>
                    <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{job.company}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 100, background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>
                    {JOB_TYPES[job.type] || job.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 12, flexWrap: 'wrap' }}>
                  {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {job.location}</span>}
                  {job.salary && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={11} /> {job.salary}</span>}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {new Date(job.createdAt).toLocaleDateString('ru')}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{job.description.length > 300 ? job.description.substring(0, 300) + '...' : job.description}</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {job.contactEmail && <a href={`mailto:${job.contactEmail}`} className="rdx-btn rdx-btn-primary rdx-btn-sm"><Briefcase size={13} /> Откликнуться</a>}
                  {job.contactUrl && <a href={job.contactUrl} target="_blank" rel="noreferrer" className="rdx-btn rdx-btn-secondary rdx-btn-sm"><ExternalLink size={13} /> Подробнее</a>}
                  {user?.id === job.authorId && <button onClick={() => handleDelete(job.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={13} /> Удалить</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
