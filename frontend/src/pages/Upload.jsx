import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Upload as UploadIcon, X, Plus, CheckCircle } from 'lucide-react';

const CATEGORIES = ['UI/UX', 'Branding', '3D & Motion', 'Illustration', 'Web Design', 'Mobile Apps', 'Typography', 'Photography'];

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
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  const handleSubmit = async () => {
    if (!title.trim()) { showToast('Введите название проекта', 'error'); return; }
    if (files.length === 0) { showToast('Добавьте хотя бы одно изображение', 'error'); return; }

    setUploading(true);
    try {
      // Step 1: Get presigned URLs
      setUploadProgress('Подготовка...');
      const { data: presignData } = await api.post('/projects/presign', {
        files: files.map(f => ({ filename: f.name, contentType: f.type })),
      });

      // Step 2: Upload each file directly to S3
      const media = [];
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

      // Step 3: Create project with URLs
      setUploadProgress('Публикация...');
      const { data } = await api.post('/projects/create', {
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        tools: tools.split(',').map(t => t.trim()).filter(Boolean),
        categoryId: category || undefined,
        coverIndex,
        media,
      });

      showToast('Проект опубликован!', 'success');
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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 48 }}>
          Загрузить проект
        </h1>

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
            <label className="input-label">Название проекта *</label>
            <input className="input" placeholder="Например: Nebula — Brand Identity" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Описание</label>
            <textarea className="input" rows={4} placeholder="Расскажите о проекте..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical', minHeight: 100 }} />
          </div>
          <div>
            <label className="input-label">Категория</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ appearance: 'none' }}>
              <option value="">Выберите категорию</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Теги (через запятую)</label>
            <input className="input" placeholder="minimal, dark, dashboard" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Инструменты (через запятую)</label>
            <input className="input" placeholder="Figma, Photoshop, Blender" value={tools} onChange={e => setTools(e.target.value)} />
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={uploading}
            style={{ width: '100%', marginTop: 16, opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? uploadProgress || 'Публикация...' : 'Опубликовать проект'}
          </button>
        </div>
      </div>
    </div>
  );
}
