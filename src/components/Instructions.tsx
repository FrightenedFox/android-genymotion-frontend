import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function Instructions() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal list-inside space-y-2">
          <li>Select a year from the dropdown and click &quot;Start Session&quot;.</li>
          <li>Wait for the session to initialize (this may take a few minutes).</li>
          <li>Once ready, select a game from the list below.</li>
          <li>Enjoy playing the selected game on the Android emulator.</li>
          <li>
            After 15 minutes of playing the same game, you will be prompted to try another game.
          </li>
          <li>
            You can switch games at any time by clicking &quot;Stop Game&quot; or &quot;Change Session&quot;.
          </li>
          <li>
            Your session will remain active for 15 minutes after your last interaction.
          </li>
          <li>
            If you experience any issues, click &quot;Change Session&quot; to create a new session.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
