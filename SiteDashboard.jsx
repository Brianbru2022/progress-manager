import React, { useState, useEffect } from 'react';
import { Home, CalendarDays, ExternalLink, Eye } from 'lucide-react';
import Loader from '../ui/Loader';
import { getStatusClasses, getStatusIcon, formatDate } from '../../utils/helpers';
import { collection, query, getDocs } from '../../utils/firebase';

const SiteDashboard = ({ db, userId, appId, sites, updateSiteStatus, setSelectedSiteId, setView, setMessage, setMessageType }) => {
  const [allTasks, setAllTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!db || !userId || sites.length === 0) {
      setLoadingTasks(false);
      setAllTasks([]);
      return;
    }
    const fetchAllTasks = async () => {
      setLoadingTasks(true);
      const tasksPromises = sites.map(async (site) => {
        const tasksCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/sites/${site.id}/tasks`);
        const q = query(tasksCollectionRef);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          siteName: site.name,
          siteId: site.id,
          ...doc.data()
        }));
      });
      try {
        const results = await Promise.all(tasksPromises);
        const mergedTasks = results.flat().filter(item => item.type === 'task');
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        const upcomingTasks = mergedTasks.filter(task => {
          const endDate = task.plannedEndDate?.toDate?.();
          return endDate && endDate >= now && endDate <= thirtyDaysFromNow && task.status !== 'Completed';
        }).sort((a, b) => (a.plannedEndDate?.toMillis?.() || 0) - (b.plannedEndDate?.toMillis?.() || 0));
        setAllTasks(upcomingTasks);
      } catch (error) {
        console.error("Error fetching all tasks for timeline:", error);
      } finally {
        setLoadingTasks(false);
      }
    };
    fetchAllTasks();
  }, [db, userId, appId, sites]);

  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center">
        <Home className="mr-3 text-blue-600" size={32} /> Your Programme Dashboard
      </h2>
      {sites.length === 0 ? (
        <p className="text-center text-gray-600 p-8 bg-gray-50 rounded-xl border border-gray-200">
          No sites added yet. Go to Site Management to add your first site!
        </p>
      ) : (
        <div className="space-y-6">
          {sites.map((site) => (
            <div key={site.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 hover:shadow-lg hover:border-blue-300">
              <div className="mb-4 sm:mb-0 flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                  {getStatusIcon(site.status, 24)}
                  <span className="ml-2">{site.name}</span>
                </h3>
                <p className="text-sm text-gray-600 pl-8">
                  <span className="font-medium">Location:</span> {site.location}
                </p>
                <p className="text-sm text-gray-600 pl-8">
                  <span className="font-medium">Planned End:</span> {formatDate(site.plannedEndDate)}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 text-sm font-semibold rounded-full border ${getStatusClasses(site.status)} min-w-[120px] text-center`}>
                  {site.status}
                </span>
                <button
                  onClick={() => { setSelectedSiteId(site.id); setView('siteDetails'); }}
                  className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  title="View Details"
                >
                  <ExternalLink size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-12 p-8 bg-gray-50 rounded-2xl shadow-inner border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <CalendarDays className="mr-3 text-purple-600" size={24} /> Upcoming Tasks (Next 30 Days)
        </h3>
        {loadingTasks ? (
          <Loader />
        ) : allTasks.length === 0 ? (
          <p className="text-center text-gray-600">No upcoming tasks in the next 30 days.</p>
        ) : (
          <div className="space-y-3">
            {allTasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div className="flex-grow">
                  <p className="font-semibold text-gray-900 flex items-center">
                    <span className="ml-2">{task.name}</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">Site:</span> {task.siteName} | <span className="font-medium">Ends:</span> {formatDate(task.plannedEndDate)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-4 py-1.5 text-xs font-medium rounded-full border ${getStatusClasses(task.status)}`}>
                    {task.status}
                  </span>
                  <button
                    onClick={() => { setSelectedSiteId(task.siteId); setView('siteDetails'); }}
                    className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteDashboard;