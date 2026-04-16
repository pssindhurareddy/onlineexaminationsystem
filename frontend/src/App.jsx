import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UnifiedLogin from './pages/auth/UnifiedLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Landing from './pages/public/Landing';
import OrganizationWrapper from './components/layout/OrganizationWrapper';
import IdentityActivation from './pages/auth/IdentityActivation';
import FacultyRequest from './pages/auth/FacultyRequest';
import SignupRequest from './pages/auth/SignupRequest';

// Dashboards
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/admin/Dashboard';
import FacultyDashboard from './pages/faculty/Dashboard';
import QuestionBank from './pages/faculty/QuestionBank';
import ExamResults from './pages/faculty/ExamResults';
import UsersRoster from './pages/admin/Users';
import AcademicsManagement from './pages/admin/Academics';
import StudentDashboard from './pages/student/Dashboard';
import TakeExam from './pages/student/TakeExam';
import ExamHistory from './pages/student/History';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShieldCheck, BookOpen, GraduationCap } from 'lucide-react';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public SaaS Landing Page */}
          <Route path="/" element={<Landing />} />
          
          {/* Organization Branded Context */}
          <Route path="/org/:orgSlug" element={<OrganizationWrapper />}>
            <Route index element={<Navigate to="login" />} />
            
            {/* Roles Specific Logins under Org */}
            <Route path="login" element={<UnifiedLogin roleConfig={{title: "Student Portal", subtitle: "Access your examinations securely.", expectedRole: 'student', icon: <GraduationCap className="text-accent" size={32} />}} />} />
            <Route path="faculty-login" element={<UnifiedLogin roleConfig={{title: "Faculty Control", subtitle: "Manage examinations and student compliance.", expectedRole: 'faculty', icon: <BookOpen className="text-accent" size={32} />}} />} />
            <Route path="admin-login" element={<UnifiedLogin roleConfig={{title: "Administrator", subtitle: "Manage institutional identities.", expectedRole: 'admin', icon: <ShieldCheck className="text-accent" size={32} />}} />} />
            
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Identity Protocol (IIS) Routes */}
            <Route path="activate" element={<IdentityActivation />} />
            <Route path="signup" element={<SignupRequest />} />
            <Route path="join" element={<FacultyRequest />} />

            {/* Admin Portal */}
            <Route element={<DashboardLayout allowedRoles={['admin']} />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<UsersRoster />} />
              <Route path="admin/departments" element={<AcademicsManagement />} />
              <Route path="admin/settings" element={<div className="p-8 text-center text-gray-500">Global Institutional Settings</div>} />
            </Route>

            {/* Faculty Portal */}
            <Route element={<DashboardLayout allowedRoles={['faculty', 'admin']} />}>
              <Route path="faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="faculty/exams" element={<FacultyDashboard />} />
              <Route path="faculty/question-bank" element={<QuestionBank />} />
              <Route path="faculty/exams/:examId/results" element={<ExamResults />} />
              <Route path="faculty/results" element={<FacultyDashboard />} />
            </Route>

            {/* Student Portal Dashboard */}
            <Route element={<DashboardLayout allowedRoles={['student']} />}>
              <Route path="student/dashboard" element={<StudentDashboard />} />
              <Route path="student/history" element={<ExamHistory />} />
            </Route>

            {/* Standalone Secure Exam Window (Outside Layout) */}
            <Route path="student/take-exam/:id" element={<TakeExam />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
