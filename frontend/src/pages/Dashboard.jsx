import { useRef, useState, useEffect } from "react";
import { Upload, Search, List, Grid, Menu, Folder, Plus, Send, MessageSquare, Sparkles, FileText, Sliders, FileTextIcon, Image } from "lucide-react";
import FolderCard from "../components/FolderCard";
import RecentFiles from "../components/RecentFiles";
import FileActivityCalendar from "../components/FileActivityCalendar";
import { 
  uploadFile, 
  getFiles, 
  searchFiles, 
  getStorageUsage,
  createFolder,
  uploadFilesToFolder, 
  getFolders,
  smartSearch,
  moveToTrash
} from "../services/api";
import { toast } from "react-toastify";
import { useNavigate, useOutletContext } from "react-router";
import FolderListCard from "../components/FolderListCard";
import { motion, AnimatePresence } from "framer-motion";

const LoadingSkeleton = ({ type = 'folder', count = 3 }) => {
  return (
    <div className={`grid grid-cols-1 ${type === 'folder' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gray-100 rounded-lg overflow-hidden animate-pulse">
          {type === 'folder' ? (
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ) : (
            <div className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  // File states
  const [file, setFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [showAllRecentFiles, setShowAllRecentFiles] = useState(false);
  
  // Folder states
  const [folderTitle, setFolderTitle] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderUsers, setFolderUsers] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [folderFiles, setFolderFiles] = useState([]);
  const [showAllFolders, setShowAllFolders] = useState(false);
  const [filesLoading, setFilesLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(true);

  
  // UI states
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalType, setFolderModalType] = useState('create'); // 'create' or 'upload'
  
  // Data states
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [storage, setStorage] = useState({ used: 0, total: 0 });
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your Zapsync assistant. Ask me anything like 'Dr. Amoako lecture notes Week 3'",
      sender: 'bot'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  // Refs
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const { toggleSidebar } = useOutletContext();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFilesLoading(true);
        setFoldersLoading(true);
        const [foldersData, filesData] = await Promise.all([
          getFolders(),
          getFiles()
        ]);
        setFolders(foldersData);
        setFiles(filesData);
        setFilteredFiles(filesData);
      } catch (error) {
        toast.error("Failed to load data: " + (error.message || "Unknown error"));
      } finally {
        setFilesLoading(false);
        setFoldersLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUploadDropdown && !event.target.closest('.relative')) {
        setShowUploadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUploadDropdown]);

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(async () => {
        try {
          const results = await searchFiles(searchQuery);
          setFilteredFiles(results);
        } catch (error) {
          toast.error("Search failed: " + (error.message || "Unknown error"));
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setFilteredFiles(files);
    }
  }, [searchQuery, files]);

  // File upload handlers
  const handleUploadClick = () => {
    fileInputRef.current.click();
    setShowUploadDropdown(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setIsPreviewOpen(true);
    }
  };

  const handleFolderClick = (folderId) => {
    navigate(`/folder/${folderId}`); // Navigate to folder page with ID
  };

  const handleFileUpload = async () => {
    setLoading(true);
    try {
      await uploadFile(file, description);
      toast.success("File uploaded successfully!");
      
      // Reset and refresh
      setFile(null);
      setIsPreviewOpen(false);
      setDescription('');
      setFilesLoading(true);
      const updatedFiles = await getFiles();
      setFiles(updatedFiles);
      setFilteredFiles(updatedFiles);
      // setStorage(await getStorageUsage());
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
      setFilesLoading(false);
    }
  };

  // Folder upload handlers
  const handleFolderUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setFolderFiles(files);
    setFolderModalType('upload');
    setShowFolderModal(true);
    e.target.value = ''; // Reset input
  };

  const handleFolderSubmit = async () => {
    if (!folderTitle.trim()) {
      toast.error("Folder name is required");
      return;
    }

    setLoading(true);
    try {
      // Create folder first
      const folder = await createFolder({
        name: folderTitle,
        description: folderDescription,
        sharedWith: folderUsers
      });

      // If uploading files, add them to folder
      if (folderModalType === 'upload' && folderFiles.length > 0) {
        await uploadFilesToFolder(folder.data._id, folderFiles);
        toast.success(`Folder created with ${folderFiles.length} files uploaded!`);
      } else {
        toast.success("Folder created successfully!");
      }

      // Reset states
      setShowFolderModal(false);
      setFolderTitle('');
      setFolderDescription('');
      setFolderUsers([]);
      setFolderFiles([]);
      
      // Refresh data
      setFoldersLoading(true);
      const updatedFolders = await getFolders();
      setFolders(updatedFolders);
      // setFilteredFiles(updatedFiles);
      // setStorage(await getStorageUsage());
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
      setFoldersLoading(false);
    }
  };

  const handleFolderStarChange = (folderId, newStarredState) => {
    setFolders(folders.map(folder => 
      folder._id === folderId ? { ...folder, is_starred: newStarredState } : folder
    ));
  };

  const handleMoveToTrash = async (id, type) => {
    try {
      // Optimistic update
      if (type === 'folder') {
        setFolders(prev => prev.filter(folder => folder._id !== id));
      } else {
        setFiles(prev => prev.filter(file => file._id !== id));
        setFilteredFiles(prev => prev.filter(file => file._id !== id));
      }
      
      await moveToTrash(id, type);
      toast.success(`${type} moved to trash`);
    } catch (error) {
      // Revert optimistic update
      if (type === 'folder') {
        const folder = folders.find(f => f._id === id);
        if (folder) setFolders(prev => [...prev, folder]);
      } else {
        const file = files.find(f => f._id === id);
        if (file) {
          setFiles(prev => [...prev, file]);
          setFilteredFiles(prev => [...prev, file]);
        }
      }
      console.log(error)
      toast.error(`Failed to move ${type} to trash`);
    }
  };
  
  const handleFileStarChange = (fileId, newStarredState) => {
    setFiles(files.map(file => 
      file._id === fileId ? { ...file, is_starred: newStarredState } : file
    ));
    setFilteredFiles(filteredFiles.map(file => 
      file._id === fileId ? { ...file, is_starred: newStarredState } : file
    ));
  };

  // Add user to folder sharing
  const addUser = () => {
    if (userInput.trim() && !folderUsers.includes(userInput.trim())) {
      setFolderUsers([...folderUsers, userInput.trim()]);
      setUserInput('');
    }
  };

  const handleChatSend = async () => {
    if (!currentMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: chatMessages.length + 1,
      text: currentMessage,
      sender: 'user'
    };
    
    setChatMessages([...chatMessages, userMessage]);
    setCurrentMessage('');
    
    try {
      // Add loading indicator
      setChatMessages(prev => [...prev, {
        id: prev.length + 2,
        text: "Searching...",
        sender: 'bot',
        isLoading: true
      }]);
      
      // Call smart search API
      const results = await smartSearch(currentMessage);
      
      // Create result components
      const resultComponents = [];
      
      // Add folders if found
      if (results.folders.length > 0) {
        resultComponents.push({
          type: 'heading',
          text: `📁 Folders (${results.folders.length})`
        });
        
        resultComponents.push({
          type: 'folders',
          items: results.folders.slice(0, 3) // Show max 3 folders
        });
      }
      
      // Add files if found
      if (results.files.length > 0) {
        resultComponents.push({
          type: 'heading',
          text: `📄 Files (${results.files.length})`
        });
        
        resultComponents.push({
          type: 'files',
          items: results.files.slice(0, 5) // Show max 5 files
        });
      }
      
      // No results case
      if (resultComponents.length === 0) {
        resultComponents.push({
          type: 'text',
          text: "No matching files or folders found."
        });
      }
      
      // Update chat - replace loading message with results
      setChatMessages(prev => [
        ...prev.slice(0, -1), // Remove loading message
        {
          id: prev.length + 3,
          text: results.message,
          sender: 'bot',
          components: resultComponents,
          isSearchResult: true
        }
      ]);
      
    } catch (error) {
      // Handle errors
      setChatMessages(prev => [
        ...prev.slice(0, -1), // Remove loading message
        {
          id: prev.length + 3,
          text: "Sorry, I couldn't complete your search. Please try again.",
          sender: 'bot'
        }
      ]);
    }
  };

  const FileIcon = ({ type }) => {
    const iconMap = {
      pdf: <FileTextIcon size={14} />,
      docx: <FileTextIcon size={14} />,
      pptx: <Sliders size={14} />,
      png: <Image size={14} />,
      jpg: <Image size={14} />,
      jpeg: <Image size={14} />,
      default: <File size={14} />
    };
    
    return iconMap[type] || iconMap.default;
  };

  return (
    <>
      {/* Header with search */}
      <div className="mb-6 flex flex-col gap-4">
      <div className="mb-6 flex items-center gap-4">
        <button className="text-gray-600" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>

        {/* Regular Search Bar - Always visible */}
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search files..." 
            className="bg-gray-200 rounded-full pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-3 text-gray-500" />
        </div>

        {/* Smart Search Toggle Button */}
        <motion.button
          onClick={() => setIsChatOpen(!isChatOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white shadow-md"
        >
          <motion.div
            animate={{ 
              y: [0, -3, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
          >
            <Sparkles size={16} />
          </motion.div>
          <span>Smart Search</span>
        </motion.button>
      </div>

      {/* Chatbot Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 mt-2 overflow-hidden"
          >
            {/* Chat messages */}
            <div className="max-h-60 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                    msg.sender === 'user' 
                      ? 'bg-[var(--color-primary)] text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.text}
                  
                  {/* Render search results if available */}
                  {msg.isSearchResult && msg.components?.map((component, i) => (
                    <div key={i} className="mt-2">
                      {component.type === 'heading' && (
                        <p className="font-semibold text-sm mb-1">{component.text}</p>
                      )}
                      
                      {component.type === 'folders' && (
                        <div className="space-y-1">
                          {component.items.map(folder => (
                            <div key={folder._id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                              <Folder size={14} />
                              <span className="text-sm truncate">{folder.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {component.type === 'files' && (
                        <div className="space-y-1">
                          {component.items.map(file => (
                            <div key={file._id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                              <FileIcon type={file.type} />
                              <span className="text-sm truncate">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            ))}
            </div>
            
            {/* Chat input */}
            <motion.div 
              className="border-t border-gray-200 p-3 flex items-center gap-2"
              layout
            >
              <motion.input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask about files (e.g. 'Dr. Amoako lecture notes Week 3')"
                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentMessage.trim()) {
                    handleChatSend();
                  }
                }}
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                disabled={!currentMessage.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${
                  currentMessage.trim()
                    ? 'text-[var(--color-primary)] hover:bg-gray-100'
                    : 'text-gray-400'
                }`}
                onClick={handleChatSend}
              >
                <Send size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Dashboard</h2>
              <div className="hidden sm:flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            
            {/* Hidden file inputs */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <input 
              type="file" 
              ref={folderInputRef} 
              onChange={handleFolderUpload} 
              style={{ display: 'none' }}
              webkitdirectory="true" 
              directory="true"
            />
            
            {/* Action buttons */}
            <div className="flex gap-4 ml-25">
              <div className="relative">
                <button 
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                  className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <Upload size={18} /> Upload
                </button>
                
                {showUploadDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div 
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onClick={handleUploadClick}
                    >
                      <Upload size={16} /> File Upload
                    </div>
                    <div 
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onClick={() => {
                        folderInputRef.current.click();
                        setShowUploadDropdown(false);
                      }}
                    >
                      <Folder size={16} /> Folder Upload
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => {
                  setFolderModalType('create');
                  setShowFolderModal(true);
                  setShowUploadDropdown(false);
                }}
                className="bg-[var(--color-primary-light)] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[var(--color-primary)] hover:text-white transition-colors"
              >
                <Plus size={18} /> Create Folder
              </button>
            </div>
          </div>

          {/* Folders Section */}
          <h2 className="text-xl font-semibold mb-4">Folders</h2>

          {foldersLoading ? (
            <LoadingSkeleton type="folder" count={3} />
          ) : folders.length > 0 ? (
            viewMode == 'grid' ? (
              <div className="space-y-6">
                {/* Top Row - First 3 Folders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.slice(0, 3).map(folder => (
                    <FolderCard 
                      key={folder._id}
                      id={folder._id}
                      title={folder.name}
                      filesCount={folder.fileCount || 0}
                      createdDate={new Date(folder.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      users={folder.shared_with?.map(user => user.avatar) || []}
                      isStarred={folder.is_starred}
                      onStarChange={handleFolderStarChange}
                      onMoveToTrash={handleMoveToTrash}
                      onClick={() => handleFolderClick(folder._id)}
                    />
                  ))}
                </div>

                {/* Bottom Row - Next 3 Folders (conditionally shown) */}
                {(showAllFolders || folders.length <= 6) && folders.length > 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folders.slice(3, 6).map(folder => (
                      <FolderCard 
                        key={folder._id}
                        id={folder._id}
                        title={folder.name}
                        filesCount={folder.fileCount || 0}
                        createdDate={new Date(folder.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        users={folder.shared_with?.map(user => user.avatar) || []}
                        isStarred={folder.is_starred}
                        onStarChange={handleFolderStarChange}
                        onMoveToTrash={handleMoveToTrash}
                        onClick={() => handleFolderClick(folder._id)}
                      />
                    ))}
                  </div>
                )}

                {/* Show More/Show Less Button */}
                {folders.length > 6 && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowAllFolders(!showAllFolders)}
                      className="text-[var(--color-primary-light)] hover:text-[#78C0B0] font-medium flex items-center gap-1 transition-colors"
                    >
                      {showAllFolders ? (
                        <>
                          <span>Show Less</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Show More ({folders.length - 6} more)</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Display remaining folders when expanded */}
                {showAllFolders && folders.length > 6 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folders.slice(6).map(folder => (
                      <FolderCard 
                        key={folder.id}
                        id={folder._id}
                        title={folder.name}
                        filesCount={folder.file_count || 0}
                        createdDate={new Date(folder.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        users={folder.shared_with?.map(user => user.avatar) || []}
                        isStarred={folder.is_starred}
                        onStarChange={handleFolderStarChange}
                        onMoveToTrash={handleMoveToTrash}
                        onClick={() => handleFolderClick(folder._id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
                // List View Implementation
              <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              {folders.slice(0, showAllFolders ? folders.length : 6).map(folder => (
                <FolderListCard 
                  key={folder.id}
                  id={folder._id}
                  title={folder.name}
                  filesCount={folder.file_count || 0}
                  createdDate={new Date(folder.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                  users={folder.shared_with?.map(user => user.avatar) || []}
                  isStarred={folder.is_starred}
                  onStarChange={handleFolderStarChange}
                  onMoveToTrash={handleMoveToTrash}
                  onClick={() => handleFolderClick(folder._id)}
                />
              ))}
              
              {folders.length > 6 && (
                <div className="flex justify-center p-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowAllFolders(!showAllFolders)}
                    className="text-[var(--color-primary-light)] hover:text-[#78C0B0] font-medium flex items-center gap-1 transition-colors"
                  >
                    {showAllFolders ? 'Show Less' : `Show More (${folders.length - 6} more)`}
                  </button>
                </div>
              )}
            </div>
            )
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">No folders yet. Create your first folder!</p>
              <button 
                onClick={() => {
                  setFolderModalType('create');
                  setShowFolderModal(true);
                }}
                className="mt-4 bg-[var(--color-primary-light)] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-[#78C0B0] transition-colors"
              >
                <Plus size={16} /> Create Folder
              </button>
            </div>
          )}

          {/* Recent files */}
          <div className={`bg-white rounded-lg shadow-sm w-full mt-10 ${
            viewMode === 'list' ? 'border border-gray-100' : 'border border-gray-100'
          }`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Recent Files</h2>
              {viewMode === 'grid' && files.length > 3 && !filesLoading  && (
                <button 
                  onClick={() => setShowAllRecentFiles(!showAllRecentFiles)}
                  className="text-sm text-[var(--color-primary)] hover:text-[#1d6a8f]"
                >
                  {showAllRecentFiles ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>
            {filesLoading ? (
                <div className="p-4">
                  <LoadingSkeleton type="file" count={3} />
                </div>
              ) : files.length > 0 ? (
              viewMode === 'list' ? (
                <div className="divide-y divide-gray-100">
                  {files.slice(0, 5).map((file, index) => (
                    <RecentFiles key={file.id || index} file={file} viewMode={viewMode} onMoveToTrash={handleMoveToTrash} />
                  ))}
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(showAllRecentFiles ? files : files.slice(0, 3)).map((file, index) => (
                      <RecentFiles 
                        key={file._id || index} 
                        file={file} 
                        viewMode={viewMode}
                        isGridItem={true}
                        onMoveToTrash={handleMoveToTrash}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No recent files</p>
              </div>
            )}
          </div>
        </div> 

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#E6E6FA] p-4 rounded-lg w-full">
          {filesLoading || foldersLoading ? (
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
            ) : (
              <FileActivityCalendar />
            )}
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">File Preview</h3>
            <div className="mb-4">
              {file?.type.startsWith("image/") && (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-full h-64 object-contain rounded-lg"
                />
              )}

              {file?.type === "application/pdf" && (
                <embed
                  src={URL.createObjectURL(file)}
                  type="application/pdf"
                  className="w-full h-64 rounded-lg"
                />
              )}

              {file?.type.startsWith("video/") && (
                <video controls className="w-full h-64 rounded-lg">
                  <source src={URL.createObjectURL(file)} type={file.type} />
                  Your browser does not support the video tag.
                </video>
              )}

              {!["image/", "application/pdf", "video/"].some(t => file?.type.startsWith(t)) && (
                <div className="text-gray-600 bg-gray-100 p-4 rounded-lg text-center">
                  <p className="font-semibold">No preview available</p>
                  <p className="text-sm mt-1">{file?.name}</p>
                </div>
              )}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              className="w-full border rounded-lg p-2 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />

            <button 
              onClick={handleFileUpload} 
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg w-full hover:bg-[#1d6a8f] transition-colors"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload File"}
            </button>
            <button 
              onClick={() => setIsPreviewOpen(false)} 
              className="mt-3 text-gray-600 w-full text-center hover:text-blue-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Folder Modal (shared for create/upload) */}
      {showFolderModal && (
        <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {folderModalType === 'upload' ? 'Upload Folder' : 'Create Folder'}
              </h3>
              <button 
                onClick={() => setShowFolderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              {/* File preview for uploads */}
              {folderModalType === 'upload' && folderFiles.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    {folderFiles.length} files selected
                  </p>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {folderFiles.slice(0, 5).map((file, index) => (
                      <p key={index} className="text-xs text-gray-500 truncate">
                        {file.webkitRelativePath || file.name}
                      </p>
                    ))}
                    {folderFiles.length > 5 && (
                      <p className="text-xs text-gray-500">+ {folderFiles.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Folder form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={folderTitle}
                  onChange={(e) => setFolderTitle(e.target.value)}
                  placeholder="e.g. Project Assets"
                  className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="What's this folder for?"
                  className="w-full border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shared With
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-8">
                  {folderUsers.map((user, index) => (
                    <div key={index} className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-800">
                      {user}
                      <button 
                        onClick={() => setFolderUsers(folderUsers.filter((_, i) => i !== index))}
                        className="ml-1.5 text-blue-600 hover:text-blue-800"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addUser()}
                    placeholder="Add user and press Enter"
                    className="w-full border rounded-lg p-2.5 pl-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {userInput && (
                    <button 
                      onClick={addUser}
                      className="absolute right-2 top-2.5 text-blue-500 hover:text-blue-700"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleFolderSubmit}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  folderTitle.trim() 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={!folderTitle.trim() || loading}
              >
                {loading ? 'Processing...' : folderModalType === 'upload' ? 'Upload Folder' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;