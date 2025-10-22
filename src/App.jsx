import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Lobby from './Lobby';
import HostScreen from './HostScreen';
import ContestantScreen from './ContestantScreen';

function App() {
  const [role, setRole] = useState(null);

  if (!role) return <Lobby setRole={setRole}/>;
  if (role === "host") return <HostScreen/>;
  if (role === "contestant") return <ContestantScreen/>;
 
}

export default App
