import { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, Download, Edit2, Share2, Star as StarIcon, Trash2, Info,
  Copy, UserPlus, Link2, File, Image, Video, FileText, Eye
} from 'lucide-react';
import styles from '../styles/FileCard.module.css'; // You'll need to create this CSS module
import useStar from '../hooks/useStar';
import FileDisplay from './FileDisplay';

const FileCard = ({ 
  file,
  viewMode = 'grid', // 'grid' or 'list'
  onStarClick,
  onShareClick,
  onRenameClick,
  onMoveToTrash
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareSubmenuOpen, setIsShareSubmenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStarred, setIsStarred] = useState(file.isStarred);
  const [isFileDisplayOpen, setIsFileDisplayOpen] = useState(false);
  const { toggleStar, checkStarred, isLoading } = useStar();
  const [isMovingToTrash, setIsMovingToTrash] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setIsShareSubmenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStarStatus = async () => {
      const starred = await checkStarred(file._id, 'file');
      setIsStarred(starred);
    };
    fetchStarStatus();
  }, [file]);


  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/file/${encodeURIComponent(file.name)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileDisplay = () => {
    setIsFileDisplayOpen(true);
    setIsMenuOpen(false);
  };

  
  useEffect(() => {
    setIsStarred(file.isStarred);
  }, [file.isStarred]);

  const handleStarClick = async () => {
    try {
      const newStarredState = !isStarred;
      setIsStarred(newStarredState);
      
      const result = await toggleStar(file._id, 'file', !isStarred);
      setIsStarred(result);
      
      if (onStarChange) {
        onStarChange(file._id, result);
      }
    } catch (error) {
      setIsStarred(isStarred);
    }
  };

  const handleMoveToTrash = async () => {
    setIsMovingToTrash(true);
    try {
      await onMoveToTrash(file._id, 'file');
      setIsMenuOpen(false);
    } catch (error) {
      toast.error("Failed to move to trash");
    } finally {
      setIsMovingToTrash(false);
    }
  };
  const getFileIcon = () => {
    if (file.type?.includes('image')) {
      return <Image size={20} className={styles.fileIcon} />;
    } else if (file.type?.includes('pdf')) {
      return <FileText size={20} className={styles.fileIcon} color="#ef4444" />;
    } else if (file.type?.includes('video')) {
      return <Video size={20} className={styles.fileIcon} color="#3b82f6" />;
    }
    return <File size={20} className={styles.fileIcon} />;
  };

  if (viewMode === 'list') {
    return (
      <div className={styles.fileListCard}>
        <div 
          className={styles.fileInfoContainer}
          onClick={handleFileDisplay}
          style={{ cursor: 'pointer' }}
          >
          <div className={styles.fileIconContainer}>
            {file.type?.includes('image') ? (
              <img 
                src={file.previewUrl} 
                alt="Preview" 
                className={styles.filePreview}
              />
            ) : (
              <div className={styles.fileIconWrapper}>
                {getFileIcon()}
              </div>
            )}
          </div>
          
          <div className={styles.fileDetails}>
            <h3 className={styles.fileName}>{file.name}</h3>
            <p className={styles.fileMeta}>
              {file.size} • {new Date(file.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className={styles.fileActions}>
        <button 
            className={styles.actionButton}
            // onClick={handlePreview}
            title="Preview"
          >
            <Eye size={18} />
          </button>
        <button 
          onClick={handleStarClick}
          disabled={isLoading}
          className={`p-1.5 rounded-full ${isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600'} ${isLoading ? 'opacity-50' : ''}`}
        >
          <StarIcon size={18} fill={isStarred ? 'currentColor' : 'none'} />
        </button>
          
          <button 
            className={styles.actionButton}
            onClick={onShareClick}
          >
            <Share2 size={18} />
          </button>
          
          <button 
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreVertical size={18} />
          </button>
          
          {isMenuOpen && (
            <div ref={menuRef} className={styles.dropdownMenu}>
              <div className={styles.menuItems}>
                <MenuItem icon={<Download size={16} />} label="Download" />
                <MenuItem 
                  icon={<Edit2 size={16} />} 
                  label="Rename" 
                  onClick={onRenameClick}
                />
                
                <div className={styles.submenuContainer}>
                  <MenuItem 
                    icon={<Share2 size={16} />} 
                    label="Share" 
                    hasArrow 
                    onMouseEnter={() => setIsShareSubmenuOpen(true)}
                  />
                  
                  {isShareSubmenuOpen && (
                    <div 
                      className={styles.submenu}
                      onMouseLeave={() => setIsShareSubmenuOpen(false)}
                    >
                      <MenuItem 
                        icon={<Copy size={16} />} 
                        label={copied ? 'Copied!' : 'Copy link'} 
                        onClick={handleCopyLink}
                      />
                      <MenuItem 
                        icon={<Link2 size={16} />} 
                        label="Share with..." 
                      />
                    </div>
                  )}
                </div>
                
                <MenuItem 
                  icon={<StarIcon size={16} />} 
                  label={isStarred ? 'Unstar' : 'Star'} 
                  onClick={onStarClick}
                />

        <MenuItem 
          icon={<Eye size={16} />} 
          label="Preview" 
          // onClick={handlePreview}
        />
                
                <div className={styles.menuDivider}></div>
                
                <MenuItem 
                  icon={<Trash2 size={16} />} 
                  label={isMovingToTrash ? 'Moving...' : 'Move to trash'} 
                  onClick={handleMoveToTrash}
                  disabled={isMovingToTrash}
                  danger
                />
                
                <MenuItem 
                  icon={<Info size={16} />} 
                  label="File info" 
                />
              </div>
            </div>
          )}
        </div>
        {isFileDisplayOpen && (
          <FileDisplay file={file} onClose={() => setIsFileDisplayOpen(false)} />
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className={styles.fileGridCard}>
     <div 
        className={styles.filePreviewContainer}
        onClick={handleFileDisplay}
        style={{ cursor: 'pointer' }}
      >
        {file.type?.includes('image') ? (
          <img 
            src={file.previewUrl} 
            alt="Preview" 
            className={styles.gridPreview}
          />
        ) : (
          <div className={styles.gridIconContainer}>
            {getFileIcon()}
          </div>
        )}
        
        {/* Preview overlay */}
        <div className={styles.previewOverlay}>
          <Eye size={20} color="white" />
        </div>
      </div>
      
      <div className={styles.gridFooter}>
        <div className={styles.gridFileInfo}>
          <h3 className={styles.gridFileName}>{file.name}</h3>
          <p className={styles.gridFileMeta}>
            {file.size} • {new Date(file.updatedAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className={styles.gridActions}>
        <button 
          onClick={handleStarClick}
          disabled={isLoading}
          className={`p-1.5 rounded-full ${isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600'} ${isLoading ? 'opacity-50' : ''}`}
        >
          <StarIcon size={18} fill={isStarred ? 'currentColor' : 'none'} />
        </button>
          
          <button 
            className={styles.gridMenuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreVertical size={16} />
          </button>
          
          {isMenuOpen && (
            <div ref={menuRef} className={styles.gridDropdownMenu}>
              <div className={styles.menuItems}>
                <MenuItem icon={<Download size={16} />} label="Download" />
                <MenuItem 
                  icon={<Edit2 size={16} />} 
                  label="Rename" 
                  onClick={onRenameClick}
                />
                
                <div className={styles.submenuContainer}>
                  <MenuItem 
                    icon={<Share2 size={16} />} 
                    label="Share" 
                    hasArrow 
                    onMouseEnter={() => setIsShareSubmenuOpen(true)}
                  />
                  
                  {isShareSubmenuOpen && (
                    <div 
                      className={styles.submenu}
                      onMouseLeave={() => setIsShareSubmenuOpen(false)}
                    >
                      <MenuItem 
                        icon={<Copy size={16} />} 
                        label={copied ? 'Copied!' : 'Copy link'} 
                        onClick={handleCopyLink}
                      />
                      <MenuItem 
                        icon={<Link2 size={16} />} 
                        label="Share with..." 
                      />
                    </div>
                  )}
                </div>
                
                <MenuItem 
                  icon={<StarIcon size={16} />} 
                  label={isStarred ? 'Unstar' : 'Star'} 
                  onClick={onStarClick}
                />
                
                <div className={styles.menuDivider}></div>
                
                <MenuItem 
                  icon={<Trash2 size={16} />} 
                  label={isMovingToTrash ? 'Moving...' : 'Move to trash'} 
                  onClick={handleMoveToTrash}
                  disabled={isMovingToTrash}
                  danger
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {isFileDisplayOpen && (
          <FileDisplay file={file} onClose={() => setIsFileDisplayOpen(false)} />
        )}
    </div>
  );
};

const MenuItem = ({ icon, label, hasArrow = false, danger = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`${styles.menuItem} ${danger ? styles.dangerItem : ''}`}
    >
      <span className={styles.menuIcon}>{icon}</span>
      <span className={styles.menuLabel}>{label}</span>
      {hasArrow && <span className={styles.menuArrow}>→</span>}
    </button>
  );
};

export default FileCard;