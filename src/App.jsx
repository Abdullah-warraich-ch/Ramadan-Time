import { useState, useEffect } from "react";

function App() {
  const [ramzan, setRamzan] = useState(null);
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [check, setCheck] = useState(false);
  const [current, setCurrent] = useState(null);

  function remainingTime(time) {
    let NextTime;
    const now = new Date();
    const [ihours, iminutes] = time.split(":").map(Number);
    const [shours, sminutes] = time.split(":").map(Number);
    const NextTimesehri = new Date();

    const NextTimeIftar = new Date();
    NextTimeIftar.setHours(ihours, iminutes, 0, 0);
    NextTimesehri.setHours(shours, sminutes, 0, 0);
    if (NextTimesehri > now) {
      NextTime = NextTimesehri;
      setCurrent("sehri");
    } else if (NextTimeIftar > now && NextTimesehri < now) {
      NextTime = NextTimeIftar;
      setCurrent("iftar");
    } else {
      setCheck(true);
      setCurrent("done");
      return;
    }
    let diff = NextTime - now;
    if (diff < 0) diff = 0;

    const h = Math.floor(diff / 1000 / 60 / 60);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);

    setTimeLeft(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
    );
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      async function getApiData() {
        const response = await fetch(
          `https://islamicapi.com/api/v1/fasting/?lat=${position.coords.latitude}&lon=${position.coords.longitude}&api_key=xZaaeSeRVvFTVjojf6KQOBYT7aihHJAAnu3zdHQVTNTvjQR3`,
        );
        const data = await response.json();
        const today = data.data.fasting[0];
        setRamzan(today);
      }
      getApiData();
    });
  }, []);

  useEffect(() => {
    if (!ramzan) return;
    if (check) {
      return;
    }
    const interval = setInterval(() => {
      remainingTime(ramzan.time.iftar);
    }, 1000);

    return () => clearInterval(interval);
  }, [ramzan]);

  if (!ramzan) return <div>Loading...</div>;

  return (
    <main
      className="relative h-screen w-screen bg-cover bg-center"
      style={{ backgroundImage: "url(/bg.avif)" }}
    >
      <div className="absolute inset-0 bg-black/50 z-0"></div>

      <h1 className="relative z-10 uppercase text-7xl font-semibold tracking-widest text-center text-white pt-20">
        Ramzan
      </h1>

      <div className="relative z-10 flex justify-between items-center max-w-[95%] md:max-w-[50%] mx-auto my-10 text-white font-semibold">
        <p>{ramzan.date}</p>
        <p>{ramzan.hijri_readable}</p>
      </div>
      <div className="relative z-10 flex justify-center items-center text-white font-semibold text-center">
        <p className="text-4xl uppercase tracking-[3rem] text-amber-300 font-normal">
          {current}
        </p>
      </div>

      <div className="relative z-10  text-white text-center w-full pt-20 justify-center items-center ">
        <h1 className="font-bold tracking-widest text-9xl">-{timeLeft}</h1>
        <p>Time Remaining</p>
      </div>
    </main>
  );
}

export default App;
