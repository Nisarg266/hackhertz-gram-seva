import { useState } from "react"
import { Login } from "./components/Login";
import { Register } from "./components/Register";

export default function App() {
  const [changeTab, setChangeTab] = useState(true);

  const handleChange = () => {
    setChangeTab(prev => !prev);
  }

  return (
    <main>
      {changeTab ? (
        <Login changePage={handleChange} />
      ) : (
        <Register changePage={handleChange} />
      )}
    </main>
  )
}
