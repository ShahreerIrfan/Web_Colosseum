import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function App() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Colosseum Admin Portal</CardTitle>
          <CardDescription>
            Tailwind CSS and shadcn/ui have been installed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Ready to build tour management, floor plans, and audio narration controls.
          </p>
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
