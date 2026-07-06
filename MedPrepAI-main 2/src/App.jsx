import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import FCPS from "./pages/FCPS";
import JCAT from "./pages/JCAT";

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <Header page={page} setPage={setPage} />
      {page === "home" && <Home setPage={setPage} />}
      {page === "fcps" && <FCPS setPage={setPage} />}
      {page === "jcat" && <JCAT setPage={setPage} />}
      <Footer setPage={setPage} />
    </div>
  );
}
