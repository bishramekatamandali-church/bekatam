import React, { useRef, useEffect, useState } from 'react';
import Button from './Button';
import { PhotoIcon } from '@heroicons/react/24/outline';

const CLOUDINARY_CLOUD_NAME = 'dl94nfxom';
const CLOUDINARY_UPLOAD_PRESET = 'bishram_ekata_mandali';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, disabled }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    const editor = editorRef.current;
    if (editor) {
      onChange(editor.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await response.json();

      if (response.ok && data.secure_url) {
        const imgHtml = `<img src="${data.secure_url}" alt="Uploaded content" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`;
        execCommand('insertHTML', imgHtml);
        handleInput(); // Manually trigger update after insertion
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg">
      <div className="flex items-center space-x-1 border-b border-slate-300 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-700 rounded-t-lg">
        <button type="button" onClick={() => execCommand('bold')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><strong>B</strong></button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><em>I</em></button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">UL</button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">OL</button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="sm" variant="ghost" className="text-xs">
          <PhotoIcon className="w-4 h-4 mr-1"/> {isUploading ? "Uploading..." : "Insert Image"}
        </Button>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose dark:prose-invert max-w-none w-full min-h-[200px] p-3 focus:outline-none bg-white dark:bg-slate-900 rounded-b-lg"
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      ></div>
    </div>
  );
};

export default RichTextEditor;
