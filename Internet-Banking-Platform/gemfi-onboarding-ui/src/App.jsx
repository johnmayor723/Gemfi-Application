import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from '@/lib/PageNotFound';
import Apply from '@/pages/Apply';
import CheckStatus from '@/pages/CheckStatus';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Apply />} />
        <Route path="/status" element={<CheckStatus />} />
        <Route path="/status/:id" element={<CheckStatus />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  )
}

export default App
