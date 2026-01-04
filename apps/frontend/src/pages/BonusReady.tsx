import React, { useEffect } from 'react'
import bonusReady from '../assets/bonusReady.png';

export const BonusReady = () => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "w") {
        handleBonus();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const handleBonus = () => {
    window.location.href = '#/bonus';
  }
 
  return (
    <main className="w-screen h-screen overflow-hidden">
      <img src={bonusReady} alt="home-img" className="w-full h-full object-cover" />
      <button className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-3xl font-extrabold" onClick={handleBonus}>
        <h1></h1>
      </button>
    </main>
  )
}
