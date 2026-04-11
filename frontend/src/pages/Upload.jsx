import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Input, Textarea, Label, Button } from '../components/ui';
import { Upload as UploadIcon, X, Plus, CheckCircle, Type, Image, Video, Code, Quote, Minus, GripVertical, Clock, Save, Eye } from 'lucide-react';

const CATEGORIES = ['UI/UX', 'Branding', '3D & Motion', 'Illustration', 'Web Design', 'Mobile Apps', 'Typography', 'Photography'];

const BLOCK_TYPES = [
  { type: 'TEXT', label: 'Текст', icon: Type },
  { type: 'HEADING', label: 'Заголовок', icon: Type },
  { type: 'IMAGE', label: 'Изображение', icon: Image },
  { type: 'IMAGE_GALLERY', label: 'Галерея', icon: Image },
  { type: 'VIDEO', label: 'Видео', icon: Video },
  { type: 'EMBED', label: 'Embed', icon: Code },
  { type: 'QUOTE', label: 'Цитата', icon: Quote },
  { type: 'DIVIDER', label: 'Разделитель', icon: Minus },
  { type: 'CODE', label: 'Код', icon: Code },
  { type: 'BEFORE_AFTER', label: 'До/После', icon: Image },
];

export default function Upload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [tags, setTags] = useState('');
  const [tools, setTools] = useState('');
  const [category, setCategory] = useState('');
  const [coverIndex, setCoverIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [industry, setIndustry] = useState('');
  const [style, setStyle] = useState('');
  const [mode, setMode] = useState('gallery'); // 'gallery' or 'case-study'
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const addBlock = (type) => {
    setBlocks(prev => [...prev, { id: Date.now(), type, content: '', mediaUrl: '', metadata: {} }]);
  };

  const updateBlock = (id, field, value) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (idx, dir) => {
    setBlocks(prev => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (i) => {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
    setCoverIndex(prev => {
      if (i < prev) return prev - 1;
      if (i === prev) return 0;
      return prev;
    });
  };

  const handleSubmit = async (asDraft = false) => {
    if (!title.trim()) { showToast('Введите название проекта', 'error'); return; }
    if (!asDraft && mode === 'gallery' && files.length === 0) { showToast('Добавьте хотя бы одно изображение', 'error'); return; }
    if (!asDraft && mode === 'case-study' && blocks.length === 0 && files.length === 0) {
      showToast('Добавьте контент в проект', 'error'); return;
    }

    setUploading(true);
    try {
      let media = [];

      // Upload files if any
      if (files.length > 0) {
        setUploadProgress('Подготовка...');
        const { data: presignData } = await api.post('/projects/presign', {
          files: files.map(f => ({ filename: f.name, contentType: f.type })),
        });

        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Загрузка ${i + 1} из ${files.length}...`);
          const file = files[i];
          const { uploadUrl, fileUrl } = presignData.uploads[i];
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          media.push({
            url: fileUrl,
            type: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
          });
        }
      }

      setUploadProgress(asDraft ? 'Сохранение черновика...' : 'Публикация...');
      const { data } = await api.post('/projects/create', {
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        tools: tools.split(',').map(t => t.trim()).filter(Boolean),
        categoryId: category || undefined,
        coverIndex,
        media: media.length > 0 ? media : undefined,
        blocks: mode === 'case-study' ? blocks.map(b => ({
          type: b.type,
          content: b.content || null,
          mediaUrl: b.mediaUrl || null,
          metadata: b.metadata || {},
        })) : undefined,
        isDraft: asDraft,
        scheduledAt: scheduledAt || undefined,
        industry: industry || undefined,
        style: style || undefined,
      });

      showToast(asDraft ? 'Черновик сохранён!' : 'Проект опубликован!', 'success');
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.response?.data?.error?.message || 'Ошибка загрузки', 'error');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 24 }}>
          Загрузить проект
        </h1>

        {/* Mode switcher */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: 32, width: 'fit-content' }}>
          <button onClick={() => setMode('gallery')} style={{
            padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
            color: mode === 'gallery' ? 'var(--text)' : 'var(--text-3)',
            background: mode === 'gallery' ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: 'none', cursor: 'pointer',
          }}>Галерея</button>
          <button onClick={() => setMode('case-study')} style={{
            padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
            color: mode === 'case-study' ? 'var(--text)' : 'var(--text-3)',
            background: mode === 'case-study' ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: 'none', cursor: 'pointer',
          }}>Кейс-стади</button>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)',
            padding: files.length ? 20 : 80, textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.3s', marginBottom: 12,
            background: 'var(--glass)',
          }}
        >
          {previews.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {previews.map((p, i) => (
                <div key={i} style={{
                  position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '4/3',
                  border: coverIndex === i ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                }} onClick={(e) => { e.stopPropagation(); setCoverIndex(i); }}>
                  {files[i]?.type?.startsWith('video') ? (
                    <video src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: coverIndex === i ? 'rgba(200,255,0,0.08)' : 'rgba(0,0,0,0)',
                    transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {coverIndex === i && <CheckCircle size={24} color="var(--accent)" />}
                  </div>
                  {coverIndex === i && (
                    <div style={{
                      position: 'absolute', top: 6, left: 6, padding: '2px 8px',
                      borderRadius: 100, background: 'var(--accent)', fontSize: 10,
                      fontWeight: 600, color: '#000', letterSpacing: '0.04em',
                    }}>ОБЛОЖКА</div>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{
                    position: 'absolute', top: 6, right: 6, width: 24, height: 24,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div style={{
                border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)',
                aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={24} color="var(--text-3)" />
              </div>
            </div>
          ) : (
            <>
              <UploadIcon size={32} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 15, marginBottom: 8 }}>Перетащите файлы или нажмите для выбора</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>PNG, JPG, GIF, MP4 до 20MB</div>
            </>
          )}
        </div>
        {previews.length > 1 && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 32 }}>
            Нажмите на фото, чтобы выбрать обложку проекта
          </div>
        )}
        {previews.length <= 1 && <div style={{ marginBottom: 20 }} />}
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFiles} />

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Label>Название проекта *</Label>
            <Input placeholder="Например: Nebula — Brand Identity" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea rows={4} placeholder="Расскажите о проекте..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical', minHeight: 100 }} />
          </div>
          <div>
            <Label>Категория</Label>
            <select className="rdx-input" value={category} onChange={e => setCategory(e.target.value)} style={{ appearance: 'none' }}>
              <option value="">Выберите категорию</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Теги (через запятую)</Label>
            <Input placeholder="minimal, dark, dashboard" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div>
            <Label>Инструменты (через запятую)</Label>
            <Input placeholder="Figma, Photoshop, Blender" value={tools} onChange={e => setTools(e.target.value)} />
          </div>

          {/* Case study block builder */}
          {mode === 'case-study' && (
            <div>
              <Label>Блоки контента</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {blocks.map((block, idx) => (
                  <div key={block.id} style={{
                    padding: 16, borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)', border: '1px solid var(--glass-border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => moveBlock(idx, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>↑</button>
                        <button onClick={() => moveBlock(idx, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>↓</button>
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                          {BLOCK_TYPES.find(bt => bt.type === block.type)?.label || block.type}
                        </span>
                      </div>
                      <button onClick={() => removeBlock(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}>
                        <X size={14} />
                      </button>
                    </div>
                    {/* Block content */}
                    {['TEXT', 'HEADING', 'QUOTE', 'CODE'].includes(block.type) && (
                      <Textarea
                        rows={block.type === 'HEADING' ? 1 : 3}
                        value={block.content}
                        onChange={e => updateBlock(block.id, 'content', e.target.value)}
                        placeholder={block.type === 'HEADING' ? 'Заголовок...' : block.type === 'QUOTE' ? 'Цитата...' : block.type === 'CODE' ? 'Код...' : 'Текст...'}
                        style={{ resize: 'vertical', fontFamily: block.type === 'CODE' ? 'monospace' : 'inherit' }}
                      />
                    )}
                    {['IMAGE', 'VIDEO', 'BEFORE_AFTER'].includes(block.type) && (
                      <Input
                        value={block.mediaUrl}
                        onChange={e => updateBlock(block.id, 'mediaUrl', e.target.value)}
                        placeholder="URL изображения или видео"
                      />
                    )}
                    {block.type === 'EMBED' && (
                      <Input
                        value={block.content}
                        onChange={e => updateBlock(block.id, 'content', e.target.value)}
                        placeholder="URL для embed (YouTube, Figma, CodePen...)"
                      />
                    )}
                    {block.type === 'IMAGE_GALLERY' && (
                      <Textarea
                        rows={2}
                        value={block.content}
                        onChange={e => updateBlock(block.id, 'content', e.target.value)}
                        placeholder="URL изображений через запятую"
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Add block buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {BLOCK_TYPES.map(bt => (
                  <button
                    key={bt.type}
                    onClick={() => addBlock(bt.type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      borderRadius: 100, background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <bt.icon size={12} /> {bt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scheduling */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Label>Индустрия</Label>
              <Input placeholder="Fintech, E-commerce..." value={industry} onChange={e => setIndustry(e.target.value)} />
            </div>
            <div>
              <Label>Стиль</Label>
              <Input placeholder="Минимализм, Brutalism..." value={style} onChange={e => setStyle(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Отложенная публикация</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={16} color="var(--text-3)" />
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ flex: 1 }} />
              {scheduledAt && <button onClick={() => setScheduledAt('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={14} /></button>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleSubmit(true)}
              disabled={uploading}
              style={{ flex: 1, opacity: uploading ? 0.6 : 1 }}
            >
              <Save size={14} /> Черновик
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleSubmit(false)}
              disabled={uploading}
              style={{ flex: 2, opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? uploadProgress || 'Публикация...' : scheduledAt ? 'Запланировать' : 'Опубликовать проект'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
