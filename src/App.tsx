import { VideoPlayer } from './components/VideoPlayer';
import { FileControls } from './components/FileControls';
import { SubtitleList } from './components/SubtitleList';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="max-w-5xl mx-auto mb-4">
        <h1 className="text-2xl font-bold text-gray-800">SRT Edit</h1>
      </header>
      <main className="max-w-5xl mx-auto flex flex-col gap-4">
        <FileControls />
        <VideoPlayer />
        <SubtitleList />
      </main>
    </div>
  );
}

export default App;
