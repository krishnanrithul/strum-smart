import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  <App />
</ThemeProvider>

// createRoot(document.getElementById("root")!).render(
//   <ThemeProvider attribute="class" defaultTheme="dark">
//     <App />
//   </ThemeProvider>
// );

createRoot(document.getElementById("root")!).render(<App />);
