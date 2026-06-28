import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home            from '../pages/Home';
import Login           from '../pages/Login';
import Register        from '../pages/Register';
import ComicDetails    from '../pages/ComicDetails';
import ReadChapter     from '../pages/ReadChapter';
import AdminDashboard  from '../pages/AdminDashboard';
import Bookmarks       from '../pages/Bookmarks';
import Notifications   from '../pages/Notifications';
import UserPreferences from '../pages/UserPreferences';
import History         from '../pages/History';
import ReadingLists    from '../pages/ReadingLists';
import Announcements   from '../pages/Announcements';
import FAQ             from '../pages/FAQ';
import Community       from '../pages/Community';
import Contact         from '../pages/Contact';
import Browse          from '../pages/Browse';
import Calendar        from '../pages/Calendar';
import UserProfile     from '../pages/UserProfile';
import EditProfile     from '../pages/EditProfile';
import GenrePage       from '../pages/GenrePage';
import AuthorPage      from '../pages/AuthorPage';
import BlockedUsers    from '../pages/BlockedUsers';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                                  element={<Home />} />
      <Route path="/login"                             element={<Login />} />
      <Route path="/register"                          element={<Register />} />
      <Route path="/comic/:id"                         element={<ComicDetails />} />
      <Route path="/comic/:comicId/chapter/:chapterId" element={<ReadChapter />} />
      <Route path="/preferences"                       element={<UserPreferences />} />
      <Route path="/history"                           element={<History />} />
      <Route path="/lists"                             element={<ReadingLists />} />
      <Route path="/bookmarks"     element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/faq"           element={<FAQ />} />
      <Route path="/community"     element={<Community />} />
      <Route path="/contact"       element={<Contact />} />
      <Route path="/browse"        element={<Browse />} />
      <Route path="/calendar"      element={<Calendar />} />
      <Route path="/user/:username"   element={<UserProfile />} />
      <Route path="/edit-profile"       element={<PrivateRoute><EditProfile /></PrivateRoute>} />
      <Route path="/genre/:genre"        element={<GenrePage />} />
      <Route path="/author/:author"      element={<AuthorPage />} />
      <Route path="/blocked-users"       element={<PrivateRoute><BlockedUsers /></PrivateRoute>} />
      <Route path="/admin/*"       element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  );
}
