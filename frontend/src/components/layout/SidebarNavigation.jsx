import { motion } from 'framer-motion';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Layers, Settings, LogOut, FileText, CheckCircle } from 'lucide-react';

export default function SidebarNavigation({ role }) {
  const { orgSlug } = useParams();
  const navigate = useNavigate();

  const roleRoutes = {
    admin: [
      { name: 'System Overview', path: `/org/${orgSlug}/admin/dashboard`, icon: LayoutDashboard },
      { name: 'Institutional Users', path: `/org/${orgSlug}/admin/users`, icon: Users },
      { name: 'Courses & Degrees', path: `/org/${orgSlug}/admin/departments`, icon: Layers },
      { name: 'Global Settings', path: `/org/${orgSlug}/admin/settings`, icon: Settings },
    ],
    faculty: [
      { name: 'Faculty Monitoring', path: `/org/${orgSlug}/faculty/dashboard`, icon: LayoutDashboard },
      { name: 'Examination Builder', path: `/org/${orgSlug}/faculty/question-bank`, icon: Layers },
      { name: 'Active Exams', path: `/org/${orgSlug}/faculty/exams`, icon: BookOpen },
      { name: 'Evaluation Reports', path: `/org/${orgSlug}/faculty/results`, icon: FileText },
    ],
    student: [
      { name: 'Student Dashboard', path: `/org/${orgSlug}/student/dashboard`, icon: LayoutDashboard },
      { name: 'Examination History', path: `/org/${orgSlug}/student/history`, icon: CheckCircle },
    ]
  };

  const routes = roleRoutes[role] || [];

  const handleLogout = () => {
    localStorage.clear();
    navigate(`/org/${orgSlug}/login`);
  };

  return (
    <motion.div 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 h-screen bg-[#050A15] border-r border-white/10 flex flex-col fixed left-0 top-0 z-50 shadow-2xl"
    >
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-background shadow-[0_0_15px_rgba(0,194,255,0.3)]">E</div>
        <span className="text-xl font-heading font-black tracking-wider text-white">EXAM<span className="text-accent">PRO</span></span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 px-2">Navigation Console</div>
        {routes.map((route) => (
          <NavLink 
            key={route.path}
            to={route.path}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive ? 'bg-accent/10 border border-accent/20 text-accent' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <route.icon size={18} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">{route.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-red-500/80 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors font-bold text-sm group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Exit Secure Session</span>
        </button>
      </div>
    </motion.div>
  );
}
