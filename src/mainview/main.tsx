import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ProjectProvider } from "./context/project-context";

// Bootstrap Electrobun RPC only when running inside the packaged app.
// In Vite HMR mode __electrobunWebviewId is not set, so we skip safely.
if (typeof window !== "undefined" && (window as any).__electrobunWebviewId) {
	import("electrobun/view").then(({ Electroview }) => {
		import("../shared/types").then((_mod) => {
			const rpc = Electroview.defineRPC<import("../shared/types").GeodesicRPCType>({
				handlers: {
					requests: {},
					messages: {},
				},
			});
			new Electroview({ rpc });
			(window as any).__geodesicRPC = rpc;
		});
	}).catch(console.error);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ProjectProvider>
			<App />
		</ProjectProvider>
	</StrictMode>,
);
