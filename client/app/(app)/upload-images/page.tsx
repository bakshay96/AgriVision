'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload as UploadIcon, 
  Search, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Check, 
  Plus, 
  X, 
  Image as ImageIcon,
  MoreVertical,
  Calendar,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface UploadRecord {
  _id: string;
  url: string;
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export default function UploadImagesPage() {
  const [images, setImages] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await uploadApi.getMyImages();
      if (response.data.success) {
        setImages(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image? This cannot be undone.')) return;

    try {
      const response = await uploadApi.deleteImage(id);
      if (response.data.success) {
        toast.success('Image deleted from S3 and database');
        setImages(images.filter(img => img._id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete image');
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredImages = images.filter(img => 
    img.originalName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Image Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Upload, store, and manage your farm images securely on AWS S3.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Image</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg p-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <ListIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-pulse rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-2/3 rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-1/3 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 py-20 px-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 mb-6">
            <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No images found</h3>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm">
            {search ? "We couldn't find any images matching your search." : "You haven't uploaded any images yet. Start by clicking the 'Upload Image' button above."}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-4 text-emerald-600 font-semibold hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img) => (
              <motion.div
                key={img._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={img.url}
                    alt={img.originalName}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        // @ts-ignore
                        copyToClipboard(img.baseUrl || img.url, img._id);
                      }}
                      className="rounded-lg bg-emerald-600/80 p-2 text-white backdrop-blur-md hover:bg-emerald-700/90 transition-colors"
                      title="Copy AWS Base URL"
                    >
                      {copiedId === img._id ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-white/20 p-2 text-white backdrop-blur-md hover:bg-white/30 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => {
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || window.location.origin;
                        const shortUrl = `${baseUrl}/api/upload/raw/${img._id}`;
                        copyToClipboard(shortUrl, `proxy-${img._id}`);
                      }}
                      className="rounded-lg bg-blue-500/80 p-2 text-white backdrop-blur-md hover:bg-blue-600/90 transition-colors"
                      title="Copy Secure Short Link"
                    >
                       {copiedId === `proxy-${img._id}` ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(img._id)}
                      className="rounded-lg bg-red-500/80 p-2 text-white backdrop-blur-md hover:bg-red-500/90 transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={img.originalName}>
                    {img.originalName}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(img.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                      {(img.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredImages.map((img) => (
                <tr key={img._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="h-10 w-16 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-xs">{img.originalName}</p>
                    <p className="text-xs text-slate-400">{format(new Date(img.createdAt), 'MMM d, yyyy h:mm a')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">{(img.size / 1024).toFixed(1)} KB</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[10px] font-bold text-emerald-600">LIVE</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button
                        onClick={() => {
                          // @ts-ignore
                          copyToClipboard(img.baseUrl || img.url, img._id);
                        }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 transition-all"
                        title="Copy AWS Base URL"
                      >
                        {copiedId === img._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || window.location.origin;
                          const shortUrl = `${baseUrl}/api/upload/raw/${img._id}`;
                          copyToClipboard(shortUrl, `proxy-${img._id}`);
                        }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-500 transition-all"
                        title="Copy Secure Short Link"
                      >
                        {copiedId === `proxy-${img._id}` ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(img._id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl shadow-emerald-900/20"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload New Image</h2>
                <button
                  disabled={isUploading}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8">
                <div className="relative">
                  <input
                    type="file"
                    id="dropzone-file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setIsUploading(true);
                      const formData = new FormData();
                      formData.append('image', file);

                      const uploadToast = toast.loading('Uploading to AWS S3...');

                      try {
                        const response = await uploadApi.uploadImage(file as any); // Type assertion for convenience
                        if (response.data.success) {
                          toast.success('Uploaded successfully!', { id: uploadToast });
                          setImages([response.data.data, ...images]);
                          setIsModalOpen(false);
                        }
                      } catch (error) {
                        console.error('Upload failed:', error);
                        toast.error('AWS S3 Upload Failed. Check your credentials.', { id: uploadToast });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  
                  <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-12 px-6 text-center transition-all ${isUploading ? 'opacity-50 grayscale' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:border-emerald-500'}`}>
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mb-4" />
                        <p className="text-sm font-semibold text-emerald-600">Uploading to AWS S3...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                          <UploadIcon className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Click to upload or drag & drop</h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          PNG, JPG, WebP or GIF (MAX. 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                   <div className="flex items-start gap-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 p-4 border border-orange-100 dark:border-orange-900/30">
                    <div className="mt-0.5 text-orange-600">ℹ️</div>
                    <div className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">
                      <strong>Note:</strong> Images are stored securely on AWS S3. Your private URL will be generated immediately after a successful upload.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-800/50">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
