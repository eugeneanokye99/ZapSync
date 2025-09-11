import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  FileText,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  Link,
  Clipboard,
  Check,
  Menu,
  Search,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getStaffGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  uploadGroupFile,
  deleteGroupFile,
  generateJoinToken
} from '../services/api';
import { sendTicketSMS } from '../utils/notifications';

function StaffGroups() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [joinTokens, setJoinTokens] = useState({});
  const [copiedToken, setCopiedToken] = useState(null);
  const navigate = useNavigate();
  const { toggleSidebar } = useOutletContext();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  // File upload state
  const [fileData, setFileData] = useState({
    file: null,
    title: '',
    description: ''
  });

  // Fetch staff groups
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStaffGroups();
      setGroups(data || []);
      setFilteredGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError(error.message || 'Failed to load groups');
      toast.error('Could not load groups at this time');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const results = groups.filter(group =>
        group?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGroups(results);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchQuery, groups]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle file input changes
  const handleFileInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFileData(prev => ({
        ...prev,
        file: files[0]
      }));
    } else {
      setFileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isPublic: true
    });
    setEditingGroup(null);
  };

  // Reset file form
  const resetFileForm = () => {
    setFileData({
      file: null,
      title: '',
      description: ''
    });
    setSelectedGroup(null);
  };

  // Open edit modal
  const openEditModal = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      isPublic: group.isPublic
    });
    setShowCreateModal(true);
  };

  // Open upload modal
  const openUploadModal = (group) => {
    setSelectedGroup(group);
    setShowUploadModal(true);
  };

  // Handle group creation/editing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingGroup) {
        await updateGroup(editingGroup._id, formData);
        toast.success('Group updated successfully');
      } else {
        await createGroup(formData);
        toast.success('Group created successfully');
      }
      
      setShowCreateModal(false);
      resetForm();
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(error.message || 'Failed to save group');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
// Handle file upload (with actual file)
const handleFileUpload = async (e) => {
  e.preventDefault();
  setUploading(true);
  
  try {
    if (!fileData.file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileData.file);
    formData.append('title', fileData.title);
    formData.append('description', fileData.description);

    
    
    await uploadGroupFile(selectedGroup._id, formData);
    toast.success('File uploaded successfully');
    
    setShowUploadModal(false);
    resetFileForm();
    fetchGroups();
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error(error.message || 'Failed to upload file');
  } finally {
    setUploading(false);
  }
};

  // Handle group deletion
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteGroup(groupId);
      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.message || 'Failed to delete group');
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (groupId, fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      await deleteGroupFile(groupId, fileId);
      toast.success('File deleted successfully');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error.message || 'Failed to delete file');
    }
  };

  // Generate join token
  const handleGenerateToken = async (groupId) => {
    try {
      const token = await generateJoinToken(groupId);
      setJoinTokens(prev => ({
        ...prev,
        [groupId]: token
      }));
      toast.success('Join token generated');
    } catch (error) {
      console.error('Error generating token:', error);
      toast.error(error.message || 'Failed to generate join token');
    }
  };

  // Copy join link to clipboard
  const copyJoinLink = (groupId) => {
    const joinLink = `${window.location.origin}/join-group?token=${joinTokens[groupId]}`;
    navigator.clipboard.writeText(joinLink);
    setCopiedToken(groupId);
    toast.success('Join link copied to clipboard');
    
    setTimeout(() => {
      setCopiedToken(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center mb-6 gap-7">
        <button className="text-gray-600" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Study Groups</h1>
          <p className="text-gray-600">
            Create and manage groups, upload files, and generate join links for students
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-hover)] flex items-center gap-2"
        >
          <Plus size={18} /> Create Group
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search your groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />
        </div>
      </div>

      {/* Groups list */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users size={20} className="text-[var(--color-primary)]" />
          Your Groups
        </h2>

        {loading && groups.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-lg p-6 text-center border border-red-100">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchGroups}
              className="text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No groups created yet
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? 'No groups match your search'
                : 'Create your first group to get started'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-hover)] flex items-center gap-2 mx-auto"
            >
              <Plus size={16} /> Create Group
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map(group => (
              <div key={group._id} className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{group.name}</h3>
                    <p className="text-gray-600">{group.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${group.isPublic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {group.isPublic ? 'Public' : 'Private'}
                      </span>
                      {/* In your group display section */}
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">
                        {group.members?.length || 0} members {/* Use members.length instead of memberCount */}
                      </span>
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs">
                        {group.files?.length || 0} files
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditModal(group)}
                      className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => openUploadModal(group)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                    >
                      <Upload size={16} /> Upload
                    </button>
                    <button
                      onClick={() => handleGenerateToken(group._id)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-1"
                    >
                      <Link size={16} /> Token
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>

                {/* Join link section */}
                {joinTokens[group._id] && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Join Link:</span>
                      <button
                        onClick={() => copyJoinLink(group._id)}
                        className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
                      >
                        {copiedToken === group._id ? (
                          <>
                            <Check size={14} /> Copied!
                          </>
                        ) : (
                          <>
                            <Clipboard size={14} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs bg-white p-2 rounded border break-all">
                      {`${window.location.origin}/join-group?token=${joinTokens[group._id]}`}
                    </div>
                  </div>
                )}

                {/* Files section */}
                {group.files && group.files.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText size={16} /> Files
                    </h4>
                    <div className="space-y-2">
                      {group.files.map(file => (
                        <div key={file._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{file.title}</div>
                            {file.description && (
                              <div className="text-sm text-gray-600">{file.description}</div>
                            )}
                            <div className="text-xs text-gray-500">
                              Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={file.url}
                              download
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Download"
                            >
                              <Download size={16} />
                            </a>
                            <button
                              onClick={() => handleDeleteFile(group._id, file._id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  rows="3"
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-gray-700">
                  Public group (anyone can join)
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Upload File to {selectedGroup?.name}
            </h2>
            <form onSubmit={handleFileUpload}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">File</label>
                <input
                  type="file"
                  name="file"
                  onChange={handleFileInputChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={fileData.title}
                  onChange={handleFileInputChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  name="description"
                  value={fileData.description}
                  onChange={handleFileInputChange}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetFileForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !fileData.file}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffGroups;