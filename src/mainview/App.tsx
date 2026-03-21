import { useState } from "react";
import { Button } from "@/components/ui/button";

function App() {
	const [count, setCount] = useState(0);

	return (
		<div className="min-h-screen bg-background text-foreground flex items-center justify-center">
			<div className="flex flex-col items-center gap-6 p-8">
				<h1 className="text-3xl font-bold tracking-tight">shadcn is working</h1>
				<p className="text-muted-foreground">
					React + Tailwind + shadcn/ui + Electrobun
				</p>
				<div className="flex items-center gap-3">
					<Button onClick={() => setCount((c) => c + 1)}>
						Count: {count}
					</Button>
					<Button variant="outline" onClick={() => setCount(0)}>
						Reset
					</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="destructive">Destructive</Button>
				</div>
			</div>
		</div>
	);
}

export default App;
