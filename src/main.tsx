import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import migration utilities to make global functions available
import './utils/migrateTargets'

createRoot(document.getElementById("root")!).render(<App />);
