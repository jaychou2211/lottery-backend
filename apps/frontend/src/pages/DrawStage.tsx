import React from 'react'
import home from '../assets/home.jpg';
import { useNavigate } from 'react-router-dom';

export const DrawStage = () => {
  const navigate = useNavigate();
  const handleLottery = () => {
    navigate('/lottery');
  }

  return (
    <main className="w-screen h-screen overflow-hidden">
      <img src={home} alt="home-img" className="w-full h-full object-cover" />
      <button className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-3xl font-extrabold bg-gray-950 rounded-full border-4 border-[#FFEE07] fill" onClick={handleLottery}>
        <h3 className="border-4 border-gray-950 px-12 py-3 rounded-full text-gray-300 hover:text-white">進入下一階段</h3>
      </button>
    </main>
  )
}
