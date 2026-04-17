import { Outlet, Navigate, useParams } from 'react-router-dom';
import SidebarNavigation from './SidebarNavigation';
import TopHeader from './TopHeader';

export default function DashboardLayout({ allowedRoles }) {
  const { orgSlug } = useParams();
  const userStr = localStorage.getItem('user');
  
  // Security Boundary Trap
  if (!userStr) {
    return <Navigate to={`/org/${orgSlug}/login`} replace />;
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return <Navigate to={`/org/${orgSlug}/login`} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/org/${orgSlug}/${user.role}/dashboard`} replace />;
  }

  return (
    <div className="flex h-screen bg-background text-white font-sans overflow-hidden">
      <SidebarNavigation role={user.role} />
      
      <div className="flex-1 flex flex-col ml-64 relative w-[calc(100%-16rem)]">
         {/* Underlying Background Aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/5 blur-[120px] pointer-events-none rounded-full" />
        
        <TopHeader user={user} />
        
        <main className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
