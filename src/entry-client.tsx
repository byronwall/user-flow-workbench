import { mount, StartClient } from "@solidjs/start/client";
import "./flow-source-reload";

export default mount(() => <StartClient />, document.getElementById("app")!);
