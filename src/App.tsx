import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import StartPage from './pages/StartPage';
import CharacterPage from './pages/CharacterPage';
import PlayPage from './pages/PlayPage';
import ResultPage from './pages/ResultPage';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/character" element={<CharacterPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
