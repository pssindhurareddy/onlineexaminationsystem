import { Bell, Search, Hexagon, ShieldCheck } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function TopHeader({ user }) {
  const { org } = useOutletContext();

  return (
    <header className="h-20 w-full backdrop-blur-md bg-background/80 border-b border-white/10 sticky top-0 z-40 px-8 flex items-center justify-between">
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent border border-accent/30 shadow-[0_0_15px_rgba(0,194,255,0.1)]">
             <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tighter leading-none">{org?.name || 'INSTITUTION'}</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Authorized Institutional Gateway</p>
          </div>
        </div>

        <div className="flex items-center bg-[#050A15] border border-white/10 rounded-full px-4 py-2 w-72 focus-within:ring-1 focus-within:ring-accent transition-all group">
          <Search size={16} className="text-gray-500 mr-2 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Global Search..." 
            className="bg-transparent border-none outline-none text-xs text-gray-300 w-full placeholder:text-gray-600 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full animate-pulse border border-background"></span>
        </button>
        
        <div className="h-6 w-[1px] bg-white/10"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <div className="text-sm font-bold text-white group-hover:text-accent transition-colors leading-none">{user?.name}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{user?.role} Access</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-purple-600 p-[2px]">
             <div className="w-full h-full rounded-[14px] bg-[#050A15] flex items-center justify-center text-white border border-white/5 shadow-lg group-hover:scale-105 transition-transform">
                <Hexagon size={18} className="opacity-80" />
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
