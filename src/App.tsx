import { VideoPlayer } from './components/VideoPlayer';
import { FileControls } from './components/FileControls';
import { SubtitleList } from './components/SubtitleList';
import { version } from '../package.json';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <main className="max-w-5xl mx-auto flex flex-col gap-4">
        <header className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <h1 className="text-2xl font-bold text-gray-800">SRT Edit {version}</h1>
            <a
              href="https://github.com/7shi/srt-edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              (Repository)
            </a>
          </div>
          <FileControls />
        </header>
        <VideoPlayer />
        <SubtitleList />
      </main>
    </div>
  );
}

export default App;
