import React, { useRef, useEffect, useState } from 'react';
import Button from './Button';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { getCloudinaryFileSizeError, getCloudinaryUploadDetails } from '../../utils/cloudinary';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  containerClassName?: string;
  toolbarClassName?: string;
  editorClassName?: string;
  toolbarOptions?: {
    bold?: boolean;
    italic?: boolean;
    unorderedList?: boolean;
    orderedList?: boolean;
    image?: boolean;
  };
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  containerClassName,
  toolbarClassName,
  editorClassName,
  toolbarOptions,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const {
    bold = true,
    italic = true,
    unorderedList = true,
    orderedList = true,
    image = true,
  } = toolbarOptions || {};

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

    const sizeError = getCloudinaryFileSizeError(file);
    if (sizeError) {
      alert(sizeError);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const uploadDetails = getCloudinaryUploadDetails('image');
    if ('error' in uploadDetails) {
      alert(uploadDetails.error);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', uploadDetails.uploadPreset);

    try {
      const response = await fetch(uploadDetails.uploadUrl, {
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
    <div className={`border border-slate-300 dark:border-slate-600 rounded-lg ${containerClassName || ''}`}>
      <div className={`flex items-center space-x-1 border-b border-slate-300 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-700 rounded-t-lg ${toolbarClassName || ''}`}>
        {bold && (
          <button type="button" onClick={() => execCommand('bold')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">
            <strong>B</strong>
          </button>
        )}
        {italic && (
          <button type="button" onClick={() => execCommand('italic')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">
            <em>I</em>
          </button>
        )}
        {unorderedList && (
          <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">
            UL
          </button>
        )}
        {orderedList && (
          <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">
            OL
          </button>
        )}
        {image && (
          <>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} size="sm" variant="ghost" className="text-xs">
              <PhotoIcon className="w-4 h-4 mr-1"/> {isUploading ? "Uploading..." : "Insert Image"}
            </Button>
          </>
        )}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        data-placeholder={placeholder}
        className={`prose dark:prose-invert max-w-none w-full min-h-[200px] p-3 focus:outline-none bg-white dark:bg-slate-900 rounded-b-lg relative empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none empty:before:absolute empty:before:top-3 empty:before:left-3 ${editorClassName || ''}`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      ></div>
    </div>
  );
};

export default RichTextEditor;
