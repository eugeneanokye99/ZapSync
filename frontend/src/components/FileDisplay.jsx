import { useState, useEffect } from 'react';
import { Download, ExternalLink, Loader, FileText, Image, Video, File, Music, X } from 'lucide-react';

const FileDisplay = ({ file, onClose }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentDisposition, setContentDisposition] = useState('inline');

  useEffect(() => {
    if (file) {
      setLoading(true);
      setError(null);
      
      let url = null;
      console.log('File details:', file);
      
      // Check if we have a Cloudinary URL or need to construct one
      if (file.cloudinary_url) {
        url = file.cloudinary_url;
      } else if (file.public_id) {
        // Construct Cloudinary URL with proper transformations
        const cloudName = 'your-cloud-name'; // Replace with your actual Cloudinary cloud name
        
        // Determine resource type based on file type
        let resourceType = 'raw';
        let transformation = '';
        
        if (file.type?.includes('image')) {
          resourceType = 'image';
          transformation = 'q_auto,f_auto'; // Automatic quality and format
        } else if (file.type?.includes('video')) {
          resourceType = 'video';
          transformation = 'q_auto';
        } else if (file.type?.includes('pdf')) {
          resourceType = 'raw';
          transformation = 'fl_attachment'; // Force download for PDF
        } else if (file.type?.includes('text') || file.type?.includes('document')) {
          resourceType = 'raw';
          transformation = '';
        }
        
        // Construct the URL
        url = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformation}/${file.public_id}`;
        
        // Add format extension if not already included in public_id
        if (file.format && !file.public_id.endsWith(`.${file.format}`)) {
          url += `.${file.format}`;
        }
      } else if (file.url) {
        // If you have a direct URL
        url = file.url;
      }
      
      if (url) {
        // Check content disposition before setting URL
        checkContentDisposition(url).then(disposition => {
          setContentDisposition(disposition);
          setFileUrl(url);
          setLoading(false);
        }).catch(() => {
          setFileUrl(url);
          setLoading(false);
        });
      } else {
        setError('No valid file URL available');
        setLoading(false);
      }
    }
  }, [file]);

  // Function to check content disposition header
  const checkContentDisposition = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const disposition = response.headers.get('content-disposition') || 'inline';
      return disposition.includes('attachment') ? 'attachment' : 'inline';
    } catch (error) {
      console.error('Error checking content disposition:', error);
      return 'inline';
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <Loader size={48} className="animate-spin text-[var(--color-primary)] mb-4" />
          <span className="text-[var(--color-text-secondary)]">Loading file content...</span>
        </div>
      );
    }

    if (error || !fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <div className="text-6xl mb-4 text-[var(--color-error)]">❌</div>
          <p className="text-[var(--color-text)] text-lg mb-2">Unable to load file</p>
          <p className="text-[var(--color-text-secondary)] text-sm">{error || 'No valid URL found for this file'}</p>
        </div>
      );
    }

    // Determine file type for rendering appropriate content
    const fileType = file.type || file.file_type || '';
    const fileExtension = file.name?.split('.').pop()?.toLowerCase() || '';
    
    // Check if file is set to download automatically
    if (contentDisposition === 'attachment') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-[var(--color-bg-secondary)] text-[var(--color-text)]">
          <div className="text-6xl mb-4 text-[var(--color-primary)]">
            <File size={64} />
          </div>
          <p className="text-xl mb-2">File download required</p>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">
            This file ({fileExtension.toUpperCase()}) cannot be displayed in the browser.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              <Download size={16} />
              Download File
            </button>
            <a 
              href={fileUrl} 
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-secondary)] transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              Open in new tab
            </a>
          </div>
        </div>
      );
    }

    // Handle displayable content
    if (fileType.includes('image') || fileExtension.match(/(png|jpg|jpeg|gif|bmp|webp|svg)/)) {
      return (
        <div className="h-full flex items-center justify-center bg-[var(--color-bg-secondary)]">
          <img 
            src={fileUrl} 
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={() => setError('Failed to load image')}
          />
        </div>
      );
    } else if (fileType.includes('pdf') || fileExtension === 'pdf') {
      // For PDFs, use Google Docs viewer as a fallback
      const pdfViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <div className="h-full w-full bg-[var(--color-bg-secondary)]">
          <iframe 
            src={pdfViewerUrl}
            className="w-full h-full border-none"
            title={file.name}
            onLoad={() => setLoading(false)}
            onError={() => setError('Failed to load PDF')}
          />
        </div>
      );
    } else if (fileType.includes('video') || fileExtension.match(/(mp4|mov|avi|mkv|webm)/)) {
      return (
        <div className="h-full flex items-center justify-center bg-[var(--color-bg-secondary)]">
          <video 
            controls 
            autoPlay
            className="max-w-full max-h-full"
            onLoadedData={() => setLoading(false)}
            onError={() => setError('Failed to load video')}
          >
            <source src={fileUrl} type={fileType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else if (fileType.includes('audio') || fileExtension.match(/(mp3|wav|ogg|flac)/)) {
      return (
        <div className="h-full flex items-center justify-center p-8 bg-[var(--color-bg-secondary)]">
          <div className="w-full max-w-md bg-[var(--color-bg)] rounded-lg p-6 shadow-md border border-[var(--color-border)]">
            <div className="flex items-center justify-center mb-6">
              <Music size={48} className="text-[var(--color-primary)]" />
            </div>
            <p className="text-center text-[var(--color-text)] mb-4">{file.name}</p>
            <audio 
              controls 
              autoPlay
              className="w-full"
              onLoadedData={() => setLoading(false)}
              onError={() => setError('Failed to load audio')}
            >
              <source src={fileUrl} type={fileType} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        </div>
      );
    } else if (fileType.includes('text') || fileExtension.match(/(txt|json|xml|csv|log|js|jsx|ts|tsx|html|css|py|java|cpp|c|h|php|rb|go|rs|swift|kt)/)) {
      return (
        <TextFileViewer fileUrl={fileUrl} fileName={file.name} />
      );
    } else if (fileExtension.match(/(doc|docx|xls|xlsx|ppt|pptx)/)) {
      // For Office documents, use Google Docs viewer
      const officeViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <div className="h-full w-full bg-[var(--color-bg-secondary)]">
          <iframe 
            src={officeViewerUrl}
            className="w-full h-full border-none"
            title={file.name}
            onLoad={() => setLoading(false)}
            onError={() => setError('Failed to load document')}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-[var(--color-bg-secondary)] text-[var(--color-text)]">
          <div className="text-6xl mb-4 text-[var(--color-primary)]">
            <File size={64} />
          </div>
          <p className="text-xl mb-2">No viewer available for this file type</p>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">{file.name} ({fileExtension})</p>
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              <Download size={16} />
              Download
            </button>
            <a 
              href={fileUrl} 
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-secondary)] transition-colors"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              Open in new tab
            </a>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-white/50 backdrop-blur bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg)] rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-xl border border-[var(--color-border)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            {file.type?.includes('image') && <Image size={20} className="text-[var(--color-primary)] flex-shrink-0" />}
            {file.type?.includes('video') && <Video size={20} className="text-[var(--color-primary)] flex-shrink-0" />}
            {file.type?.includes('audio') && <Music size={20} className="text-[var(--color-primary)] flex-shrink-0" />}
            {file.type?.includes('text') && <FileText size={20} className="text-[var(--color-primary)] flex-shrink-0" />}
            {!file.type?.includes('image') && !file.type?.includes('video') && !file.type?.includes('audio') && !file.type?.includes('text') && 
              <File size={20} className="text-[var(--color-primary)] flex-shrink-0" />}
            <h2 className="text-lg font-semibold truncate text-[var(--color-text)]">{file.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded transition-colors text-[var(--color-text)]"
              title="Download"
              disabled={!fileUrl}
            >
              <Download size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-bg-secondary)] rounded transition-colors text-[var(--color-text)]"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Component for displaying text files
const TextFileViewer = ({ fileUrl, fileName }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        const response = await fetch(fileUrl);
        if (response.ok) {
          const text = await response.text();
          setContent(text);
        } else {
          setError('Failed to load text content');
        }
      } catch (err) {
        setError('Error loading text file');
      } finally {
        setLoading(false);
      }
    };

    fetchTextContent();
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[var(--color-bg-secondary)]">
        <Loader size={48} className="animate-spin text-[var(--color-primary)] mb-4" />
        <span className="text-[var(--color-text-secondary)]">Loading text content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-[var(--color-bg-secondary)] text-[var(--color-text)]">
        <div className="text-6xl mb-4 text-[var(--color-error)]">❌</div>
        <p className="text-lg mb-2">Unable to load text content</p>
        <p className="text-[var(--color-text-secondary)] text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--color-bg-secondary)] text-[var(--color-text)] p-4">
      <div className="bg-[var(--color-bg)] rounded p-4 h-full overflow-auto border border-[var(--color-border)]">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {content}
        </pre>
      </div>
    </div>
  );
};

export default FileDisplay;