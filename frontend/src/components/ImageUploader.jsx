import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import client, { getErrorMessage } from '../api/client.js';

export default function ImageUploader({ value = [], onChange, max = 10, multiple = true, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const images = Array.isArray(value) ? value : [];

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    const remaining = multiple ? max - images.length : 1;
    if (remaining <= 0) {
      toast.error(`Tối đa ${max} ảnh`);
      return;
    }
    const selected = files.slice(0, remaining);
    const formData = new FormData();
    selected.forEach((file) => formData.append('images', file));
    setUploading(true);
    try {
      const res = await client.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls = res.data.data?.urls || [];
      onChange?.(multiple ? [...images, ...urls] : urls.slice(0, 1));
      toast.success('Đã tải ảnh lên');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Tải ảnh thất bại'));
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index) => onChange?.(images.filter((_, i) => i !== index));

  const makeCover = (index) => {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange?.([picked, ...next]);
  };

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-sand">
            <img src={url} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
            {index === 0 && multiple && <span className="badge absolute left-2 top-2 bg-primary text-white">Ảnh bìa</span>}
            <div className="absolute right-2 top-2 flex gap-1">
              {multiple && index !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(index)}
                  className="rounded-md bg-white/90 p-1.5 text-ink hover:text-primary"
                  title="Đặt làm ảnh bìa"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button type="button" onClick={() => removeAt(index)} className="rounded-md bg-white/90 p-1.5 text-ink hover:text-danger" title="Xóa ảnh">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {(multiple ? images.length < max : images.length === 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white text-sm text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-wait"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span>{uploading ? 'Đang tải lên...' : 'Thêm ảnh'}</span>
          </button>
        )}
      </div>
      {multiple && <p className="mt-2 text-xs text-muted">Tối đa {max} ảnh. Ảnh đầu tiên được dùng làm ảnh bìa.</p>}
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} hidden onChange={handleFiles} />
    </div>
  );
}
