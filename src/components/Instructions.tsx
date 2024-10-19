export function Instructions() {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Instructions</h2>
      <ol className="list-decimal list-inside space-y-2">
        <li>Wait for the session to initialize (this may take a few moments).</li>
        <li>Once ready, select a game from the list below.</li>
        <li>Enjoy playing the selected game on the Android emulator.</li>
        <li>
          You can switch games at any time by clicking "Stop Game" or "Change Session".
        </li>
        <li>
          Your session will remain active for 15 minutes after your last interaction.
        </li>
        <li>
          If you experience any issues, click "Change Session" to create a new session.
        </li>
      </ol>
    </div>
  );
}
