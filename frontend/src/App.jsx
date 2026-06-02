import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import MatchesPage from './pages/MatchesPage';
import BracketPage from './pages/BracketPage';
import SpecialPage from './pages/SpecialPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import MyGroupsPage from './pages/MyGroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import ProfilePage from './pages/ProfilePage';
import StandingsPage from './pages/StandingsPage';
import ComparisonPage from './pages/ComparisonPage';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

function PlayerOnly({ children }) {
  const { token, isAdmin } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (isAdmin()) return <Navigate to="/admin" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, isAdmin } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { token } = useAuthStore();
  return (
    <Routes>
      <Route path="/login"    element={token ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/" /> : <RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index                      element={<PlayerOnly><DashboardPage /></PlayerOnly>} />
        <Route path="grupos"              element={<GroupsPage />} />
        <Route path="partidos"            element={<MatchesPage />} />
        <Route path="eliminatoria"        element={<BracketPage />} />
        <Route path="especiales"          element={<SpecialPage />} />
        <Route path="tabla"               element={<LeaderboardPage />} />
        <Route path="mis-grupos"          element={<MyGroupsPage />} />
        <Route path="mis-grupos/:id"      element={<GroupDetailPage />} />
        <Route path="perfil"              element={<ProfilePage />} />
        <Route path="tablas"             element={<StandingsPage />} />
        <Route path="comparar/:userId"     element={<ComparisonPage />} />
        <Route path="admin"               element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
