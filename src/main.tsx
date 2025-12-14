import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove initial loader once React hydrates
const root = document.getElementById("root")!;
const loader = root.querySelector('.initial-loader');
if (loader) loader.remove();

createRoot(root).render(<App />);
