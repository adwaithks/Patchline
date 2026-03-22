import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import type { PatchlineRpcClient } from "@/lib/patchline-rpc";

const LOG = "[patchline:webview]";

async function init() {
	console.log(`${LOG} init() start`, {
		electrobun: Boolean((window as any).__electrobunWebviewId),
	});

	if ((window as any).__electrobunWebviewId) {
		try {
			const { Electroview } = await import("electrobun/view");
			const rpc = Electroview.defineRPC<import("../shared/types").PatchlineRPCType>({
				handlers: { requests: {}, messages: {} },
			});
			new Electroview({ rpc });
			window.__patchlineRPC = rpc as PatchlineRpcClient;
			console.log(`${LOG} RPC ready (Electroview + __patchlineRPC set)`);
		} catch (err) {
			console.error(`${LOG} RPC bootstrap failed`, err);
		}
	} else {
		console.log(`${LOG} no __electrobunWebviewId — dev preview / Vite only`);
	}

	console.log(`${LOG} mounting React root`);
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}

init();
