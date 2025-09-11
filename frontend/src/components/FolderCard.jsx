import { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, Download, Edit2, Share2, Star as StarIcon, Trash2, Info,
  Copy, UserPlus, Link2, Folder as FolderIcon
} from 'lucide-react';
import styles from '../styles/FolderCard.module.css';
import useStar from '../hooks/useStar'; 

const FolderCard = ({ 
  id,
  title = 'Untitled Folder', 
  filesCount = 0, 
  createdDate = 'Unknown date', 
  users = [],
  isStarred: initialIsStarred = false,
  onStarChange,
  onMoveToTrash,
  onClick
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareSubmenuOpen, setIsShareSubmenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStarred, setIsStarred] = useState(initialIsStarred);
  const { toggleStar, checkStarred, isLoading } = useStar(); 
  const [isMovingToTrash, setIsMovingToTrash] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsStarred(initialIsStarred);
  }, [initialIsStarred]);

  useEffect(() => {
    const fetchStarStatus = async () => {
      const starred = await checkStarred(id, 'folder');
      setIsStarred(starred);
    };
    fetchStarStatus();
  }, [id]);

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/folder/${encodeURIComponent(title)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMoveToTrash = async () => {
    setIsMovingToTrash(true);
    try {
      await onMoveToTrash(id, 'folder');
      setIsMenuOpen(false);
    } catch (error) {
      toast.error("Failed to move to trash");
    } finally {
      setIsMovingToTrash(false);
    }
  };

  const handleStarClick = async () => {
    try {
      // Optimistic update
      const newStarredState = !isStarred;
      setIsStarred(newStarredState);
      
      // Call API
      const result = await toggleStar(id, 'folder', !isStarred);
      
      // Sync with actual result (in case of error)
      setIsStarred(result);
      
      // Notify parent if needed
      if (onStarChange) {
        onStarChange(id, result);
      }
    } catch (error) {
      // Error is already handled by the hook
      setIsStarred(!isStarred); // Revert if error
    }
  };

  return (
    <div className={styles.folderCard}>
      {/* Folder Header */}
      <div className={styles.folderHeader}>
        <div className={styles.folderTitleContainer} onClick={onClick}>
          <div className={styles.folderIconContainer}>
            <FolderIcon size={20} className={styles.folderIcon} />
          </div>
          <h3 className={styles.folderTitle}>{title}</h3>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={styles.menuButton}
          aria-label="Folder options"
        >
          <MoreVertical size={18} />
        </button>
      </div>
      
      {/* Folder Metadata */}
      <div className={styles.folderMetadata}>
        <div className={styles.fileInfo} onClick={onClick}>
          <span>{filesCount} {filesCount === 1 ? 'file' : 'files'}</span>
          <span>{createdDate}</span>
        </div>
        
        <div className={styles.footer}>
          <div className={styles.userAvatars}>
            {users.slice(0, 3).map((user, index) => (
              <img 
                key={index} 
                src={user || 'https://via.placeholder.com/40'} 
                alt="User" 
                className={styles.avatar} 
              />
            ))}
            {users.length > 3 && (
              <div className={styles.moreUsers}>+{users.length - 3}</div>
            )}
            <button className={styles.addUserButton}>
              <UserPlus size={16} />
            </button>
          </div>
          
          {/* Updated Star Button */}
          <button 
            onClick={handleStarClick}
            disabled={isLoading}
            className={`${styles.starButton} ${isStarred ? styles.starred : ''} ${isLoading ? styles.loading : ''}`}
            aria-label={isStarred ? 'Unstar folder' : 'Star folder'}
          >
            <StarIcon size={18} fill={isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      
      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div ref={menuRef} className={styles.dropdownMenu}>
          <div className={styles.menuItems}>
            <MenuItem icon={<Download size={16} />} label="Download" />
            <MenuItem icon={<Edit2 size={16} />} label="Rename" />
            
            {/* Share with Submenu */}
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
            
            {/* Updated Star Menu Item */}
            <MenuItem 
              icon={<StarIcon size={16} />} 
              label={isStarred ? 'Unstar' : 'Star'} 
              onClick={handleStarClick}
              disabled={isLoading}
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
              label="Folder info" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Updated MenuItem to support disabled state
const MenuItem = ({ icon, label, hasArrow = false, danger = false, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.menuItem} ${danger ? styles.dangerItem : ''} ${disabled ? styles.disabledItem : ''}`}
    >
      <span className={styles.menuIcon}>{icon}</span>
      <span className={styles.menuLabel}>{label}</span>
      {hasArrow && <span className={styles.menuArrow}>→</span>}
    </button>
  );
};

export default FolderCard;