import home from '../assets/home.jpg';

export const Home = () => {
  const handleLottery = () => {
    window.location.href = '#/lottery';
  }

  return (
    <main className="w-screen h-screen overflow-hidden">
      <img src={home} alt="home-img" className="w-full h-full object-cover" />
      <button className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-3xl font-extrabold bg-gray-950 rounded-full border-4 border-[#FFEE07] fill" onClick={handleLottery}>
        <h3 className="border-4 border-gray-950 px-12 py-3 rounded-full text-gray-300 hover:text-white">進入抽獎系統</h3>
      </button>
    </main>
  )
}
