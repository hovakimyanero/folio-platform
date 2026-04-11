import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Input, Textarea, Label, Button } from '../components/ui';
import { ArrowLeft, Upload, Plus, X, Image, Package } from 'lucide-react';

const TYPES = [
  { value: 'UI_KIT', label: 'UI Kit' },
  { value: 'TEMPLATE', label: 'Шаблон' },
  { value: 'ICON_PACK', label: 'Иконки' },
  { value: 'FONT', label: 'Шрифт' },
  { value: 'MOCKUP', label: 'Мокап' },
  { value: 'ILLUSTRATION', label: 'Иллюстрация' },
  { value: 'TEXTURE', label: 'Текстура' },
  { value: 'OTHER', label: 'Другое' },
];

export default function MarketplaceCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [type, setType] = useState('UI_KIT');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [productFiles, setProductFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handlePreviews = (e) => {
    const files = Array.from(e.target.files || []);
    setPreviewFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePrev = (i) => {
    setPreviewFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleProductFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setProductFiles(prev => [...prev, ...files]);
  };

  const removeProductFile = (i) => {
    setProductFiles(prev => prev.filter((_, idx) => idx !== i));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };

  const uploadFiles = async (fileList, folder) => {
    if (!fileList.length) return [];
    const presignData = fileList.map(f => ({ filename: f.name, contentType: f.type }));
    const { data } = await api.post('/marketplace/presign', { files: presignData });
    const urls = [];
    for (let i = 0; i < data.length; i++) {
      await fetch(data[i].uploadUrl, {
        method: 'PUT',
        body: fileList[i],
        headers: { 'Content-Type': fileList[i].type },
      });
      urls.push(data[i].fileUrl);
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !type || !coverFile) {
      showToast('Заполните все обязательные поля', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const [coverUrls, previewUploadedUrls, fileUrls] = await Promise.all([
        uploadFiles([coverFile], 'cover'),
        uploadFiles(previewFiles, 'previews'),
        uploadFiles(productFiles, 'files'),
      ]);

      await api.post('/marketplace', {
        title,
        description,
        price: parseFloat(price) || 0,
        type,
        tags,
        cover: coverUrls[0],
        previews: previewUploadedUrls,
        files: fileUrls,
      });

      showToast('Товар добавлен!', 'success');
      navigate('/marketplace');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Ошибка создания товара', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Using Label/Input/Textarea components from UI library

  return (
    <div style={{ paddingTop: 100, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Header */}
        <button
          onClick={() => navigate('/marketplace')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
            color: 'var(--text-3)', cursor: 'pointer', marginBottom: 24, fontSize: 14,
          }}
        >
          <ArrowLeft size={16} /> Назад к маркетплейсу
        </button>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Добавить товар
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 40 }}>
          Загрузите дизайн-ресурс для продажи или бесплатной раздачи
        </p>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <Label>Название *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Например: Modern UI Kit для Figma"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <Label>Описание *</Label>
            <Textarea
              style={{ minHeight: 120, resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Подробное описание вашего ресурса..."
              maxLength={2000}
            />
          </div>

          {/* Type & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <Label>Тип *</Label>
              <select
                className="rdx-input"
                value={type}
                onChange={e => setType(e.target.value)}
                style={{ appearance: 'none' }}
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Цена (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0 = бесплатно"
              />
              {parseFloat(price) === 0 && (
                <span style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, display: 'block' }}>Бесплатно</span>
              )}
            </div>
          </div>

          {/* Cover */}
          <div style={{ marginBottom: 24 }}>
            <Label>Обложка *</Label>
            {coverPreview ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 8 }}>
                <img src={coverPreview} alt="cover" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                  style={{
                    position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '40px 24px', borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--glass-border)', cursor: 'pointer',
                transition: 'border-color 0.2s', gap: 8,
              }}>
                <Image size={32} color="var(--text-3)" />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Перетащите или нажмите для загрузки</span>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Рекомендуется 1600×900</span>
                <input type="file" accept="image/*" onChange={handleCover} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* Preview images */}
          <div style={{ marginBottom: 24 }}>
            <Label>Превью изображения</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {previewUrls.map((url, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => removePrev(i)}
                    style={{
                      position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                      borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                border: '2px dashed var(--glass-border)', cursor: 'pointer',
              }}>
                <Plus size={24} color="var(--text-3)" />
                <input type="file" accept="image/*" multiple onChange={handlePreviews} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Product files */}
          <div style={{ marginBottom: 24 }}>
            <Label>Файлы товара</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {productFiles.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Package size={16} color="var(--text-3)" />
                    <span style={{ fontSize: 13 }}>{f.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProductFile(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px 24px', borderRadius: 'var(--radius-sm)',
                border: '2px dashed var(--glass-border)', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)',
              }}>
                <Upload size={16} /> Добавить файлы (.zip, .fig, .sketch, .ai и др.)
                <input type="file" multiple onChange={handleProductFiles} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 32 }}>
            <Label>Теги (до 10)</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {tags.map((t, i) => (
                <span key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 12px', borderRadius: 100, fontSize: 12,
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                }}>
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                style={{ flex: 1 }}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Введите тег и нажмите Enter"
                maxLength={30}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="secondary"
              >
                Добавить
              </Button>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              onClick={() => navigate('/marketplace')}
              variant="secondary"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Публикация...' : 'Опубликовать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
