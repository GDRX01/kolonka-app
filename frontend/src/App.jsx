import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout, { AuthLayout } from './components/Layout.jsx';
import { GuestOnly, RequireAdmin, RequireAuth } from './components/Guards.jsx';
import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Article from './pages/Article.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Cabinet from './pages/Cabinet.jsx';
import Editor from './pages/Editor.jsx';
import { About, NotFound } from './pages/Misc.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Overview from './admin/Overview.jsx';
import AdminPosts from './admin/Posts.jsx';
import AdminUsers from './admin/Users.jsx';
import Taxonomy from './admin/Taxonomy.jsx';
import Complaints from './admin/Complaints.jsx';

export default function App() {
  return (
    <Routes>
      {/* Login / registration: no header and footer; signed-in users are redirected away */}
      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      {/* Public site (header + footer) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/articles/:id" element={<Article />} />
        <Route path="/about" element={<About />} />

        <Route element={<RequireAuth />}>
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/cabinet/posts/new" element={<Editor />} />
          <Route path="/cabinet/posts/:id/edit" element={<Editor />} />
        </Route>
      </Route>

      {/* Administrator panel (own layout with the dark sidebar) */}
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="taxonomy" element={<Taxonomy />} />
          <Route path="complaints" element={<Complaints />} />
        </Route>
      </Route>

      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route element={<PublicLayout />}><Route path="*" element={<NotFound />} /></Route>
    </Routes>
  );
}
