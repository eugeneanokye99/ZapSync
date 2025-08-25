import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, FileStack, HardDrive, 
  UploadCloud, DownloadCloud, Activity, Menu 
} from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { getAnalytics } from '../services/api';
import { useOutletContext } from 'react-router';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const iconComponents = {
  users: Users,
  activeUsers: UserCheck,
  files: FileStack,
  storage: HardDrive,
  uploads: UploadCloud,
  downloads: DownloadCloud
};

function Statistics() {
  const [analytics, setAnalytics] = useState({
    totalUsers: 2,
    activeUsers: 1,
    totalFiles: 57,
    storageUsed: 0,
    uploadsToday: 0,
    downloadsToday: 0,
    usageTrend: Array(7).fill(0).map((_, i) => ({
      day: `Day ${i+1}`,
      uploads: Math.floor(Math.random() * 20),
      downloads: Math.floor(Math.random() * 30)
    })),
    fileTypes: [
      { type: 'PDF', count: 45 },
      { type: 'DOCX', count: 30 },
      { type: 'PPTX', count: 15 },
      { type: 'XLSX', count: 10 }
    ]
  });
  const { toggleSidebar } = useOutletContext();

  useEffect(() => {
    const loadData = async () => {
      const data = await getAnalytics();
      setAnalytics(prev => ({
        ...prev,
        ...data.analytics
      }));
    };
    loadData();
  }, []);

  // Chart data configurations
  const uploadDownloadData = {
    labels: analytics.usageTrend.map(day => day.day),
    datasets: [
      {
        label: 'Uploads',
        data: analytics.usageTrend.map(day => day.uploads),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Downloads',
        data: analytics.usageTrend.map(day => day.downloads),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1
      }
    ]
  };

  const fileTypeData = {
    labels: analytics.fileTypes.map(file => file.type),
    datasets: [
      {
        data: analytics.fileTypes.map(file => file.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center mb-6 gap-7">
          <button className="text-gray-600" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Analytics Dashboard</h1>
        </div>
      </div>
      
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<Users className="w-6 h-6 text-blue-500" />}
          title="Total Users"
          value={analytics.totalUsers}
          trend="+12% from last week"
        />
        <StatCard 
          icon={<UserCheck className="w-6 h-6 text-green-500" />}
          title="Active Users"
          value={analytics.activeUsers}
          trend="+5% from yesterday"
        />
        <StatCard 
          icon={<FileStack className="w-6 h-6 text-purple-500" />}
          title="Total Files"
          value={analytics.totalFiles}
          trend="+8% from last month"
        />
        <StatCard 
          icon={<UploadCloud className="w-6 h-6 text-yellow-500" />}
          title="Today's Uploads"
          value={analytics.uploadsToday}
          trend="+3 from yesterday"
        />
        <StatCard 
          icon={<DownloadCloud className="w-6 h-6 text-red-500" />}
          title="Today's Downloads"
          value={analytics.downloadsToday}
          trend="+15 from yesterday"
        />
        <StatCard 
          icon={<HardDrive className="w-6 h-6 text-indigo-500" />}
          title="Storage Used"
          value={`${analytics.storageUsed} MB`}
          trend="+5% from last week"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold">Uploads & Downloads Trend</h2>
          </div>
          <div className="h-80">
            <Bar 
              data={uploadDownloadData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <FileStack className="w-5 h-5 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold">File Type Distribution</h2>
          </div>
          <div className="h-80">
            <Pie 
              data={fileTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
    <div className="flex items-start space-x-4">
      <div className="p-2 rounded-lg bg-opacity-20 bg-blue-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {trend && (
          <p className="text-xs text-gray-400 mt-1">{trend}</p>
        )}
      </div>
    </div>
  </div>
);

export default Statistics;