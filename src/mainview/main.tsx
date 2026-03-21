import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ProjectProvider } from "./context/project-context";

const LOG = "[geodesic:webview]";

async function init() {
	console.log(`${LOG} init() start`, {
		electrobun: Boolean((window as any).__electrobunWebviewId),
	});

	if ((window as any).__electrobunWebviewId) {
		try {
			const { Electroview } = await import("electrobun/view");
			const rpc = Electroview.defineRPC<import("../shared/types").GeodesicRPCType>({
				handlers: { requests: {}, messages: {} },
			});
			new Electroview({ rpc });
			(window as any).__geodesicRPC = rpc;
			console.log(`${LOG} RPC ready (Electroview + __geodesicRPC set)`);
		} catch (err) {
			console.error(`${LOG} RPC bootstrap failed`, err);
		}
	} else {
		console.log(`${LOG} no __electrobunWebviewId — dev preview / Vite only`);
	}

	console.log(`${LOG} mounting React root`);
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<ProjectProvider>
				<App />
			</ProjectProvider>
		</StrictMode>,
	);
}

init();
