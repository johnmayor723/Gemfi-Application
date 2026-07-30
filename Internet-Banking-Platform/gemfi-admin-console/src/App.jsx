import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageNotFound from '@/lib/PageNotFound';
import Login from '@/pages/Login';
import Queue from '@/pages/Queue';
import RequestDetail from '@/pages/RequestDetail';
import NewRequest from '@/pages/NewRequest';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Queue /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewRequest /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
