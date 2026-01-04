import React, { useState, useEffect, useCallback } from 'react'
import { postApiCreateBonusPrize } from '../apis/postApiCreateBonusPrize';
import { getApiPrize } from "../apis/getApiPrize";
import { getApiCurrentPrizeWinners } from "../apis/getApiCurrentPrizeWinners";
import { WinnerList } from '../components/WinnerList';
import { useRaffleContext } from "../contexts/RaffleContext";
import { getApiRemainingCount } from '../apis/getApiRemainingCount';
// static resources
import { FaAngleRight } from "react-icons/fa";
import bonus_title from "../assets/bonus_title.png";

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

export const Bonus = () => {
  const { raffleId } = useRaffleContext();
  const [inputPrize, setInputPrize] = useState<string>('');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [rank, setRank] = useState<string>('');
  const [currentPrize, setCurrentPrize] = useState<CurrentPrize | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [showWinnerList, setShowWinnerList] = useState<boolean>(false);
  const [remainingCount, setRemainingCount] = useState<number>(0);

  const handleInputPrizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPrize(e.target.value);
  }
  const handleInputAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputAmount(e.target.value);
  }

  const fetchPrizes = async () => {
    try {
      const prize = await getApiPrize(raffleId);
      console.log(prize);

      const prizeData = prize.drawProgress.upcoming[0];
      setCurrentPrize(prizeData);
      setRank(prizeData.rank);
      return prizeData.rank; // 回傳 rank
    } catch (error) {
      console.error('Failed to fetch prizes:', error);
      return null;
    }
  };

  const fetchWinners = async (rankToUse: string) => {
    if (!rankToUse) return;
    try {
      const response = await getApiCurrentPrizeWinners(raffleId, rankToUse);
      console.log(response);

      setWinners(response.winners);
      setShowWinnerList(true);
    } catch (error: any) {
      console.error('Failed to fetch winners:', error);

      if (error.message && error.message.includes('400')) {
        setShowWinnerList(false);
        alert('此獎項已抽過，請點選下一獎');
      }
    }
  };

  const fetchRemainingCount = useCallback(async () => {
    try {
      const response = await getApiRemainingCount(raffleId);
      console.log('Remaining count:', response);
      setRemainingCount(response.remainingCount);
    } catch (error) {
      console.error('Failed to fetch remaining count:', error);
    }
  }, [raffleId]);

  const handleDraw = async () => {
    try {
      // 1. 建立加碼獎項
      await postApiCreateBonusPrize(raffleId, {
        name: inputPrize,
        total: Number(inputAmount)
      });
      console.log('Bonus prize created successfully');

      // 2. 取得獎項資訊並獲取 rank
      const newRank = await fetchPrizes();

      // 3. 使用獲取的 rank 抽取得獎者
      if (newRank) {
        await fetchWinners(newRank);
      }

      // 4. 更新尚未得獎人數
      fetchRemainingCount();

      // 5. 清空 input 值
      setInputPrize('');
      setInputAmount('');
    } catch (error) {
      console.error('Failed to create bonus prize and draw winners:', error);
      alert('建立加碼獎項失敗，請重試');
    }
  };

  useEffect(() => {
    if (raffleId) {
      fetchRemainingCount();
    }
  }, [raffleId, fetchRemainingCount]);

  return (
    <main className='min-h-screen bg-[#22BDF1]'>

      <img src={bonus_title} className='absolute top-20 left-1/2 transform -translate-x-1/2' alt="bonus-title" />

      {/* input box */}
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-4'>
        <input type="text" className='text-3xl p-6 rounded-xl text-center bg-black text-white handleNext w-[32rem]' placeholder='請輸入獎品' value={inputPrize} onChange={handleInputPrizeChange} />
        <input type="number" className='text-3xl p-6 rounded-xl text-center bg-black text-white handleNext w-[15rem]' placeholder='請輸入人數' value={inputAmount} onChange={handleInputAmountChange} />
      </div>

      {/* draw btn */}
      <button className="absolute bottom-56 left-1/2 transform -translate-x-1/2 text-3xl font-extrabold bg-gray-950 rounded-full border-4 border-[#FFEE07] fill">
        <h3 className="border-4 border-gray-950 px-12 py-3 rounded-full text-gray-300 hover:text-white" onClick={handleDraw}>立即抽獎</h3>
      </button>

      {/* show winner list */}
      {showWinnerList && (
        <div className="fixed top-0 right-0 h-screen w-screen z-50">
          <WinnerList winners={winners} onClose={() => setShowWinnerList(false)} />
        </div>
      )}

      {/* next btn */}
      {/* <button className="absolute top-6 right-0 transform -translate-x-1/2 text-xl font-extrabold bg-gray-950 rounded-full fill">
        <h3 className="border-4 border-gray-950 px-6 py-3 rounded-full text-gray-300 hover:text-white">下一獎</h3>
      </button> */}

      <div className="absolute bottom-12 right-12 gap-4 text-center">
        <h3 className="text-xl font-bold mb-2">尚未抽出人數</h3>
        <div className="bg-black bg-opacity-50 w-44 rounded-lg">
          <p className="text-xl text-white bg-black py-4 rounded-lg">
            {remainingCount}
          </p>
        </div>
      </div>

      {/* sidebar */}
      <div className="sidebar bg-gray-950 pb-4">
        <div className="absolute top-0 -right-8 bg-gray-950 p-2">
          <button className="text-2xl text-white flex items-center">
            <FaAngleRight />
          </button>
        </div>
      </div>
    </main>
  )
}
