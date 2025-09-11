import { useState, useRef, useEffect } from 'react';
import { 
  Folder, Share2, MoreVertical, Star as StarIcon,
  Download, Edit2, Trash2, Info, Copy, UserPlus, Link2
} from 'lucide-react';
import useStar from '../hooks/useStar';

const FolderListCard = ({ 
  id,
  title, 
  filesCount, 
  createdDate, 
  users, 
  isStarred: initialIsStarred,
  onStarChange,
  onStarClick,
  onShareClick,
  onRenameClick,
  onDownloadClick,
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
      const starred = await checkStarred(id, 'folder');
      setIsStarred(starred);
    };
    fetchStarStatus();
  }, [id]);

  useEffect(() => {
    setIsStarred(initialIsStarred);
  }, [initialIsStarred]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/folder/${encodeURIComponent(title)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStarClick = async () => {
    try {
      // Optimistic update
      const newStarredState = !isStarred;
      setIsStarred(newStarredState);
      
      // Call API
      const result = await toggleStar(id, 'folder', isStarred);
      
      // Sync with actual result (in case of error)
      setIsStarred(result);
      
      // Notify parent if needed
      if (onStarChange) {
        onStarChange(id, result);
      }
    } catch (error) {
      // Error is already handled by the hook
      setIsStarred(isStarred); // Revert if error
    }
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

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors relative cursor-pointer">
      <div className="flex items-center gap-4 min-w-0" onClick={onClick}>
        <div className="p-2 rounded-lg bg-[#E8F4F3] text-[var(--color-primary)]">
          <Folder size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{title}</h3>
          <p className="text-sm text-gray-500">
            {filesCount} {filesCount === 1 ? 'file' : 'files'} • {createdDate}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          {users.slice(0, 3).map((user, index) => (
            <img 
              key={index} 
              src={user} 
              alt="User" 
              className="w-8 h-8 rounded-full border-2 border-white object-cover" 
            />
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="text-gray-400 hover:text-[var(--color-primary)] p-1.5 rounded-full"
            onClick={onShareClick}
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={handleStarClick}
            disabled={isLoading}
            className={`p-1.5 rounded-full ${isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-600'} ${isLoading ? 'opacity-50' : ''}`}
          >
            <StarIcon size={18} fill={isStarred ? 'currentColor' : 'none'} />
          </button>
          <button 
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute right-4 top-14 z-10 bg-white rounded-md shadow-lg py-1 w-48 border border-gray-200"
        >
          <button
            onClick={onDownloadClick}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            <Download size={16} className="mr-3" />
            Download
          </button>
          <button
            onClick={onRenameClick}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            <Edit2 size={16} className="mr-3" />
            Rename
          </button>
          
          {/* Share Submenu */}
          <div className="relative">
            <button
              onMouseEnter={() => setIsShareSubmenuOpen(true)}
              className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <div className="flex items-center">
                <Share2 size={16} className="mr-3" />
                Share
              </div>
              <span>→</span>
            </button>
            
            {isShareSubmenuOpen && (
              <div 
                onMouseLeave={() => setIsShareSubmenuOpen(false)}
                className="absolute left-full top-0 ml-1 bg-white rounded-md shadow-lg py-1 w-48 border border-gray-200"
              >
                <button
                  onClick={handleCopyLink}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Copy size={16} className="mr-3" />
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <button
                  onClick={onShareClick}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Link2 size={16} className="mr-3" />
                  Share with...
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={onStarClick}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            <StarIcon size={16} className="mr-3" fill={isStarred ? 'currentColor' : 'none'} />
            {isStarred ? 'Unstar' : 'Star'}
          </button>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <button
            onClick={handleMoveToTrash}
            disabled={isMovingToTrash}
            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
          >
            <Trash2 size={16} className="mr-3" />
            {isMovingToTrash ? 'Moving...' : 'Move to trash'} 
          </button>
        </div>
      )}
    </div>
  );
};

export default FolderListCard;