import { useState, useEffect } from "react";

import { Button } from "./Button";

export function Gradient() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hours = new Date().getHours();
      if (hours < 12) {
        setGreeting("Morning");
      } else if (hours < 18) {
        setGreeting("Afternoon");
      } else if (hours < 21) {
        setGreeting("afternoon");
      } else {
        setGreeting("Evening");
      }
    };

    updateGreeting();
    const intervalId = setInterval(updateGreeting, 60000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="px-16">
      <div className="relative z-[5] w-90 flex flex-col items-center lg:items-center text-center">
        <h1 className="text-6xl font-bold tracking-tight text-pretty text-gray-50 mt-16">WELCOME! TO GRAMSEVA <span className="text--500"></span></h1>
        <h1 className="text-6xl font-bold tracking-tight text-pretty text-gray-50"> Good <span className="text--500">{greeting}</span></h1>
        <h2 className="text-5xl font-semibold text-pretty text-gray-100 mt-16">Sign-in and Registration</h2>
        <p className="text-2xl text-black mt-7">Gujarat All schemes are available here scholarship , kisan yojana, LPG based subsidies.</p>

      </div>
    </section>
  );
}
