import { useLocation } from 'react-router-dom';
import { Background } from './Background';
import { GlassFoundation } from './GlassFoundation';
import { CameraFeedback } from '../input/CameraFeedback';
import './AppLayout.css';

/**
 * AppLayout Component
 * Main layout wrapper for all screens
 * Provides consistent glassmorphic background and camera feedback integration
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Screen content
 */
export const AppLayout = ({ children }) => {
  const location = useLocation();
  const isLockScreen = location.pathname === '/lock';

  return (
    <div className="app-layout">
      <Background />
      <GlassFoundation>
        <div key={location.pathname} className="app-layout__content">
          {children}
        </div>
        {!isLockScreen && <CameraFeedback />}
      </GlassFoundation>
    </div>
  );
};