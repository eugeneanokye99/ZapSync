import React, { useState } from "react";
import {
  Plus,
  Upload,
  FileEdit,
  PenTool,
  Pen,
  FileText,
  FileCode,
  FileSpreadsheet,
  X,
  Menu,
  Search
} from "lucide-react";
import { useOutletContext } from "react-router";

export default function Dashboard() {
  const { toggleSidebar } = useOutletContext();
  const fileList = [
    { name: "Data Structures and Algorithms", type: "pdf", preview: "Preview content for Data Structures" },
    { name: "Operating Systems", type: "pdf", preview: "Preview content for Operating Systems" },
    { name: "Database Management Systems", type: "docx", preview: "Preview content for Database Management Systems" },
    { name: "Computer Networks", type: "pdf", preview: "Preview content for Computer Networks" },
    { name: "Software Engineering", type: "pdf", preview: "Preview content for Software Engineering" },
    { name: "Artificial Intelligence", type: "docx", preview: "Preview content for Artificial Intelligence" },
    { name: "Web Technologies", type: "pdf", preview: "Preview content for Web Technologies" },
    { name: "Computer Security", type: "pdf", preview: "Preview content for Computer Security" },
    { name: "Programming with Python", type: "docx", preview: "Preview content for Programming with Python" },
    { name: "Machine Learning", type: "pdf", preview: "Preview content for Machine Learning" },
    { name: "Human-Computer Interaction", type: "xlsx", preview: "Preview content for Human-Computer Interaction" },
    { name: "Distributed Systems", type: "pdf", preview: "Preview content for Distributed Systems" }
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const filteredFiles = fileList.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button className="text-gray-600" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">KNUST Computer Science files</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search KNUST Computer Science files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 md:gap-4 mb-6 md:mb-8">
        <ActionButton icon={<FileEdit size={18} />} label="Edit PDF" color="bg-purple-500 hover:bg-purple-600" />
        <ActionButton icon={<PenTool size={18} />} label="Get Signatures" color="bg-orange-500 hover:bg-orange-600" />
        <ActionButton icon={<Pen size={18} />} label="Sign Yourself" color="bg-pink-500 hover:bg-pink-600" />
      </div>

      {/* Suggested Files */}
      <Section title="Suggested Files">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <FileCard
                key={file.name}
                name={file.name}
                type={file.type}
                onClick={() => setSelectedFile(file)}
              />
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center py-8">No matching files found.</p>
          )}
        </div>
      </Section>

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md md:max-w-lg lg:max-w-xl p-4 md:p-6 relative animate-fadeIn overflow-y-auto max-h-screen">
            {/* Close Button */}
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black z-10"
            >
              <X size={20} />
            </button>

            {/* File Info */}
            <div className="flex items-center gap-3 mb-4">
              {getIcon(selectedFile.type)}
              <h3 className="text-lg font-semibold break-words">{selectedFile.name}</h3>
            </div>

            {/* Preview Content */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {selectedFile.preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, label, color }) {
  return (
    <button
      className={`flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 text-white rounded-full shadow-md transition-transform transform hover:scale-105 text-sm md:text-base ${color}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{title}</h2>
      {children}
    </div>
  );
}

function FileCard({ name, type, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-start p-3 md:p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="w-full h-20 sm:h-24 md:h-28 bg-gradient-to-br from-blue-100 to-blue-200 rounded mb-2 md:mb-3 flex items-center justify-center">
        {getIcon(type)}
      </div>
      <p className="font-medium text-sm md:text-base line-clamp-2">{name}</p>
      <p className="text-xs text-gray-400 uppercase mt-1">{type} • KNUST CS</p>
    </div>
  );
}

function getIcon(type) {
  switch (type) {
    case "pdf":
      return <FileText size={20} className="text-red-500" />;
    case "docx":
      return <FileCode size={20} className="text-blue-500" />;
    case "xlsx":
      return <FileSpreadsheet size={20} className="text-green-500" />;
    default:
      return <FileText size={20} className="text-gray-500" />;
  }
}