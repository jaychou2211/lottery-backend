import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { WinnerList } from '../components/WinnerList';
// static resources
import background from '../assets/background.png';
import home from '../assets/home.jpg';
import { FaAngleRight } from "react-icons/fa";
import { getApiPrize } from "../apis/getApiPrize";
import { getApiCurrentPrizeWinners } from "../apis/getApiCurrentPrizeWinners";
import { useRaffleContext } from "../contexts/RaffleContext";


interface CurrentPrize {
  id: number;
  name: string;
  rank: string;
  prizeLevel: string;
  imageUrl: string;
  eligibleCounts: {
    kind: string;
    total: number;
    senior: number;
    junior: number;
  };
}

interface Winner {
  participantId: number;
  staffNumber: string;
  name: string;
  department: string;
  role: string;
  drawnGroup: string;
}

export const Lottery = () => {
  const { raffleId } = useRaffleContext();
  const [rank, setRank] = useState<string>('');
  const [nextRank, setNextRank] = useState<string>('');
  const [currentPrize, setCurrentPrize] = useState<CurrentPrize | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinnerList, setShowWinnerList] = useState<boolean>(false);
  const navigate = useNavigate();

  const fetchPrizes = useCallback(async () => {
    if (raffleId === null) return;

    try {
      const prize = await getApiPrize(raffleId);
      console.log(prize); // 在這裡檢查完整的資料

      // 如果沒有待抽獎項，導向到 bonus 頁面
      if (prize.drawProgress.upcoming.length === 0) {
        navigate('/bonus');
        return;
      }

      const prizeData = prize.drawProgress.upcoming[0];
      const nextPrizeData = prize.drawProgress.upcoming[1];
      setCurrentPrize(prizeData);
      setRank(prizeData.rank);
      setNextRank(nextPrizeData.rank)
    } catch (error) {
      console.error('Failed to fetch prizes:', error);
    }
  }, [raffleId, navigate]);

  const handleNextPrize = () => {
    // 判定抽獎階段 （rank 與 nextRank 的第一個數字是否不同）
    if (rank && nextRank) {
      const currentRankStage = rank.charAt(0);
      const nextRankStage = nextRank.charAt(0);

      if (currentRankStage !== nextRankStage) {
        navigate('/draw-stage');
        return;
      }
    }

    // 如果第一個數字相同，正常執行 fetchPrizes
    fetchPrizes();
  };

  const fetchWinners = async () => {
    if (!rank || raffleId === null) return;

    try {
      const response = await getApiCurrentPrizeWinners(raffleId, rank);
      console.log(response);

      setWinners(response.winners);
      setShowWinnerList(true)
    } catch (error: any) {
      console.error('Failed to fetch winners:', error);

      // 如果是 400 錯誤，顯示提示
      if (error.message && error.message.includes('400')) {
        setShowWinnerList(false)
        alert('此獎項已抽過，請點選下一獎');
      }
    }
  };

  const handleDraw = () => {
    fetchWinners()
  }

  useEffect(() => {
    if (raffleId !== null) {
      fetchPrizes();
    }
  }, [raffleId, fetchPrizes]);

  return (
    <main className="min-h-screen bg-primaryOrange">
      <div className="w-full h-full text-center mx-auto">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 top-6 w-[44rem] mx-auto bg-gray-950 rounded-xl border-8 border-[#F18E22]">
          {/* 當前獎品 */}
          <h2 className="text-4xl text-center py-8 px-2 text-white font-bold rounded-xl">
            {currentPrize?.prizeLevel} - {currentPrize?.name}
          </h2>
        </div>

        {/* banner */}
        <div className="w-full mx-auto px-6 pt-28">
          <img src={background} alt="banner" />
        </div>

        {/* next btn */}
        <button className="absolute top-6 right-0 transform -translate-x-1/2 text-xl font-extrabold bg-gray-950 rounded-full fill">
          <h3 className="border-4 border-gray-950 px-6 py-3 rounded-full text-gray-300 hover:text-white" onClick={handleNextPrize}>下一獎</h3>
        </button>

        {/* prize */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <img src={currentPrize?.imageUrl} alt="prize" className="max-w-[62.5rem] max-h-[70vh] object-contain" onError={(e) => {
            e.currentTarget.src = home;
          }} />
        </div>

        {/* draw btn */}
        <button className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-3xl font-extrabold bg-gray-950 rounded-full fill">
          <h3 className="border-4 border-gray-950 px-12 py-3 rounded-full text-gray-300 hover:text-white" onClick={handleDraw}>點我抽大獎</h3>
        </button>

        {/* show winner list */}
        {showWinnerList && (
          <div className="fixed top-0 right-0 h-screen w-screen z-50">
            <WinnerList prizeName={currentPrize?.name} winners={winners} onClose={() => setShowWinnerList(false)} />
          </div>
        )}

        <div className="sidebar bg-gray-950 pb-4">
          <div className="absolute top-0 -right-8 bg-gray-950 p-2">
            <button
              className="text-2xl text-white flex items-center hover:text-gray-300"
              onClick={() => setShowWinnerList(true)}
            >
              <FaAngleRight />
            </button>
          </div>
        </div>

        <div className="absolute bottom-12 right-12 flex justify-center gap-4">
          <div>
            <h3 className="text-xl font-bold mb-2">資深組</h3>
            <div className="bg-black bg-opacity-50 w-28 py-4 rounded-lg">
              <p className="text-xl text-white">
                {currentPrize?.eligibleCounts.senior}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">青年組</h3>
            <div className="bg-black bg-opacity-50 w-28 py-4 rounded-lg">
              <p className="text-xl text-white">
                {currentPrize?.eligibleCounts.junior}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
