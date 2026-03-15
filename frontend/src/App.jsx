import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'

import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import SideMenu from './components/SideMenu.jsx'
import BottomNav from './components/BottomNav.jsx'
import VolumePopup from './components/VolumePopup.jsx'

import Home from './pages/Home.jsx'
import Dome from './pages/Dome.jsx'
import Body from './pages/Body.jsx'
import Audio from './pages/Audio.jsx'
import Scripts from './pages/Scripts.jsx'
import Settings from './pages/Settings.jsx'
import Debug from './pages/Debug.jsx'
import Shutdown from './pages/Shutdown.jsx'
import Profiles from './pages/Profiles.jsx'
import Admin from './pages/admin/Admin.jsx'
import EditServos from './pages/admin/EditServos.jsx'
import EditBuses from './pages/admin/EditBuses.jsx'
import Connection from './pages/admin/Connection.jsx'
import ControllerConfig from './pages/admin/ControllerConfig.jsx'
import ArduinoConfig from './pages/admin/ArduinoConfig.jsx'
import AudioLibrary from './pages/AudioLibrary.jsx'
import Simulation from './pages/Simulation.jsx'
import ScriptEditor from './pages/ScriptEditor.jsx'

import { ProfileContext } from './context/ProfileContext.js'
import { useProfile } from './hooks/useProfile.js'
import { RecordingProvider } from './context/RecordingContext.jsx'

export default function App() {
  const [menuState, setMenuState] = useState('left')
  const [volumeOpen, setVolumeOpen] = useState(false)
  const profileValue = useProfile()
  const { activeProfile } = profileValue

  const isTouch = activeProfile?.layout === 'touch'

  function toggleMenu() {
    setMenuState(s => {
      if (s === 'closed') return 'left'
      if (s === 'left') return 'right'
      return 'closed'
    })
  }

  return (
    <ProfileContext.Provider value={profileValue}>
      <RecordingProvider>
      <HashRouter>
        <div className="wrapper">
          <Header onMenuToggle={toggleMenu} onVolumeOpen={() => setVolumeOpen(true)} />
          <VolumePopup open={volumeOpen} onClose={() => setVolumeOpen(false)} />
          <div className="contentwrapper">
            {!isTouch && <SideMenu side="left" visible={menuState === 'left'} />}
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dome" element={<Dome />} />
                <Route path="/body" element={<Body />} />
                <Route path="/audio" element={<Audio />} />
                <Route path="/scripts" element={<Scripts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/debug" element={<Debug />} />
                <Route path="/shutdown" element={<Shutdown />} />
                <Route path="/profiles" element={<Profiles />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/servos" element={<EditServos />} />
                <Route path="/admin/buses" element={<EditBuses />} />
                <Route path="/admin/connection" element={<Connection />} />
                <Route path="/admin/controller" element={<ControllerConfig />} />
                <Route path="/admin/arduino" element={<ArduinoConfig />} />
                <Route path="/audio-library" element={<AudioLibrary />} />
                <Route path="/simulation" element={<Simulation />} />
                <Route path="/script-editor" element={<ScriptEditor />} />
              </Routes>
            </div>
            {!isTouch && <SideMenu side="right" visible={menuState === 'right'} />}
          </div>
          {isTouch ? <BottomNav /> : <Footer />}
        </div>
      </HashRouter>
      </RecordingProvider>
    </ProfileContext.Provider>
  )
}
