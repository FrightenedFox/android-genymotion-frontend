export function Instructions() {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Wait for the session to initialize</li>
          <li>Once ready, select a game from the list below</li>
          <li>Enjoy playing the selected game on the Android emulator</li>
          <li>You can switch games at any time</li>
          <li>Click "Close Session" when you're done</li>
        </ol>
      </div>
    );
  }