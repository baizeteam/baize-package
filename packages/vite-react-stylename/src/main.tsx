// import React from "react";
import ReactDOM from "react-dom/client";
import "./index.module.less";
import "@/assets/index.less";

function App() {
  return <div styleName="app-container">Hello vite-react-stylename!</div>;
}

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
