import { motion } from 'framer-motion';

export default function StatCard({ title, value, subValue, icon: Icon, colorClass = "text-accent", delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel p-6 border border-white/5 hover:border-white/10 transition-colors group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform group-hover:scale-150 transition-transform duration-700 ease-out">
        <Icon size={120} />
      </div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-white mb-2 font-heading tracking-tight">{value}</div>
          {subValue && <div className={`text-xs font-medium ${colorClass}`}>{subValue}</div>}
        </div>
        <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}
