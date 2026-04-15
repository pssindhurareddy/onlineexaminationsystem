import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { ShieldCheck, Globe, Users, CheckCircle2, Key } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onRegister = async (data) => {
    try {
      await api.post('/auth/register-organization', data);
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-accent selection:text-background">
      {/* Hero Section */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2 font-heading font-bold text-2xl tracking-tighter">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <ShieldCheck size={20} className="text-background" />
          </div>
          EXAM<span className="text-accent">PRO</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-gray-400">
           <a href="#features" className="hover:text-white transition-colors">Key Protocols</a>
           <a href="#portal" className="hover:text-white transition-colors">Access Portal</a>
           <a href="#register" className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full border border-white/10 transition-all font-bold">Launch Identity</a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              <h1 className="text-6xl lg:text-7xl font-bold font-heading leading-[1.1] tracking-tight">
                Academic Integrity, <br />
                <span className="text-gray-500">Scaled for </span> <span className="text-white">Success.</span>
              </h1>
              <p className="text-xl text-gray-400 mt-6 max-w-lg leading-relaxed">
                The premier examination infrastructure for Schools, Colleges, and Professional Corporations. Establish branded academic environments with full-scale security.
              </p>
            </motion.div>

            <div className="flex items-center gap-4">
               <a href="#register" className="bg-accent hover:bg-accent/80 text-background px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-accent/20">Setup Your Institution</a>
            </div>
          </div>

          <div className="relative">
             <div className="absolute inset-0 bg-accent/20 blur-[120px] rounded-full" />
             <div className="relative premium-card border border-white/10 p-2 overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop" 
                  alt="Institutional Portal Overview" 
                  className="rounded-xl shadow-2xl saturate-[0.8] contrast-[1.1]"
                />
             </div>
          </div>
        </div>

        {/* Feature Grid */}
        <section id="features" className="mt-20 grid md:grid-cols-3 gap-12">
           <div className="space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-accent">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-bold font-heading">Secure Institutional Gateway</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Each institution operates within a strictly isolated, primary-branded environment with dedicated access controls.</p>
           </div>
           <div className="space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-accent">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold font-heading">Anti-Cheat Protocols</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Real-time socket monitoring, tab-switch detection, and forced fullscreen lockdown ensure examination integrity.</p>
           </div>
           <div className="space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-accent">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold font-heading">Academic Structural Mapping</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Seamlessly model complex institutional structures, faculty departments, and distinct learner cohorts.</p>
           </div>
        </section>

        {/* Registration Form */}
        <section id="register" className="mt-24 max-w-4xl mx-auto">
           <div className="premium-card p-12 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full" />
              
              {!success ? (
                <>
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold font-heading tracking-tight">Establish Institutional Presence</h2>
                    <p className="text-gray-400 mt-2">Initialize your private institutional environment with full-scale administrative oversight.</p>
                  </div>

                  <form onSubmit={handleSubmit(onRegister)} className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Institution Name</label>
                      <input {...register('name', { required: true })} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none" placeholder="e.g. Stanford University" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Institution Slug (URL)</label>
                      <input {...register('slug', { required: true })} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none" placeholder="stanford" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Admin Email</label>
                      <input {...register('adminEmail', { required: true })} type="email" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none" placeholder="admin@stanford.edu" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Admin Password</label>
                      <input {...register('adminPassword', { required: true })} type="password" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none" placeholder="••••••••" />
                    </div>
                    <div className="col-span-2">
                      <button disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/80 text-background font-bold py-5 rounded-2xl transition-all shadow-lg shadow-accent/20 uppercase tracking-widest text-xs">
                        {isSubmitting ? 'Initializing Environment...' : 'Launch Institutional Environment'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-10 space-y-6">
                   <div className="mx-auto w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success border border-success/20">
                     <CheckCircle2 size={40} />
                   </div>
                   <h2 className="text-3xl font-bold font-heading">Initialization Successful</h2>
                   <p className="text-gray-400">Your institutional environment has been established. Administrative master keys have been authorized.</p>
                   <button onClick={() => window.location.hash = ''} className="bg-white/5 hover:bg-white/10 px-8 py-3 rounded-xl border border-white/10 transition-colors">Return to Overview</button>
                </div>
              )}
           </div>
        </section>

        {/* Portal Access & Identity Activation */}
        <section id="portal" className="mt-12 max-w-4xl mx-auto space-y-8">
           <div className="grid md:grid-cols-2 gap-6">
              {/* Access Existing Portal */}
              <div className="premium-card p-6 border border-white/10 space-y-4 text-left relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={100} />
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-xl font-bold font-heading text-white">Access Portal</h2>
                    <p className="text-xs text-gray-500">Sign in to your authorized terminal.</p>
                 </div>
                 <div className="space-y-3">
                    <input 
                      id="portal-slug" 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-accent transition-all placeholder:text-gray-800" 
                      placeholder="Institutional ID (e.g. stanford)" 
                    />
                    <button 
                      onClick={() => {
                        const slug = document.getElementById('portal-slug').value;
                        if (slug) window.location.href = `/org/${slug}/login`;
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-sm"
                    >
                      Authenticate
                    </button>
                 </div>
              </div>

              {/* Identity Activation Terminal */}
              <div className="premium-card p-6 border border-white/10 bg-accent/[0.03] space-y-4 text-left relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-accent">
                    <Key size={100} />
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-xl font-bold font-heading text-accent">Claim Identity</h2>
                    <p className="text-xs text-gray-500">Use your Genesis Key to activate access.</p>
                 </div>
                 <div className="space-y-3">
                    <input 
                      id="activate-slug" 
                      className="w-full bg-black/40 border border-accent/20 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-accent transition-all placeholder:text-gray-800" 
                      placeholder="Institutional ID" 
                    />
                    <button 
                      onClick={() => {
                        const slug = document.getElementById('activate-slug').value;
                        if (slug) window.location.href = `/org/${slug}/activate`;
                      }}
                      className="w-full bg-accent hover:bg-accent/80 text-background font-black py-3 rounded-xl transition-all shadow-xl shadow-accent/20 active:scale-[0.98] text-sm"
                    >
                      Activate
                    </button>
                 </div>
              </div>
           </div>

           <p className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck size={12} /> Institutional Integrity Protocol
           </p>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex justify-between items-center text-sm text-gray-500">
         <div>© 2026 ExamPro Systems Inc. All rights reserved.</div>
         <div className="flex gap-8">
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">Security</a>
           <a href="#" className="hover:text-white transition-colors">Terms</a>
         </div>
      </footer>
    </div>
  );
}
