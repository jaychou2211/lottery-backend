import { useEffect, useState } from 'react';
import home from '../assets/home.jpg';
import { getApiDrawResults } from '../apis/getApiDrawResults';
import { getApiDrawResultByStaffId } from '../apis/getApiDrawResultByStaffId';
import { useRaffleContext } from '../contexts/RaffleContext';

export const DrawResults = () => {
  const { raffleId } = useRaffleContext();
  const [drawResults, setDrawResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [staffDrawResult, setStaffDrawResult] = useState<any>(null);

  useEffect(() => {
    const fetchDrawResults = async () => {
      try {
        const data = await getApiDrawResults(raffleId);
        setDrawResults(data);
        console.log('得獎者資訊:', data);
      } catch (error) {
        console.error('載入得獎者資訊失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrawResults();
  }, [raffleId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      alert('請輸入員工編號');
      return;
    }

    try {
      const data = await getApiDrawResultByStaffId(raffleId, inputValue);
      setStaffDrawResult(data);
      console.log('員工得獎資訊:', data);
    } catch (error) {
      console.error('查詢員工得獎資訊失敗:', error);
      alert('查詢失敗，請確認員工編號是否正確');
    }
  };

  if (loading) {
    return (
      <main className="w-screen h-screen overflow-hidden relative flex items-center justify-center">
        <img src={home} alt="home-img" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-85"></div>
        <div className="absolute text-white text-2xl">載入中...</div>
      </main>
    );
  }

  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <img src={home} alt="home-img" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black bg-opacity-85"></div>

      {/* 搜尋欄 */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className='text-lg p-3 rounded-xl text-center bg-gray-900 text-white border-2 border-yellow-500 w-[20rem] focus:outline-none focus:border-yellow-400'
            placeholder='請輸入員工編號查詢'
            value={inputValue}
            onChange={handleInputChange}
          />
        </form>
      </div>

      {/* 查詢結果顯示 */}
      {staffDrawResult && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 bg-gray-900 border-2 border-yellow-500 rounded-xl p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-yellow-500 text-xl font-bold">查詢結果</h3>
            <button
              onClick={() => setStaffDrawResult(null)}
              className="text-white hover:text-yellow-500 text-2xl"
            >
              ✕
            </button>
          </div>
          {staffDrawResult.wonPrizes && staffDrawResult.wonPrizes.length > 0 ? (
            <div className="text-white">
              <p className="text-lg mb-2">
                <span className="text-yellow-500">員工編號：</span>{staffDrawResult.participant.staffNumber}
              </p>
              <p className="text-lg mb-2">
                <span className="text-yellow-500">姓名：</span>{staffDrawResult.participant.name}
              </p>
              <p className="text-lg mb-2">
                <span className="text-yellow-500">部門：</span>{staffDrawResult.participant.department}
              </p>

              <p className="text-lg mb-2">
                <span className="text-yellow-500">得獎：</span>{staffDrawResult.wonPrizes[0].prizeName}
              </p>
              <p className="text-sm text-gray-400 mb-2">
                獎項等級: {staffDrawResult.wonPrizes[0].rank} ({staffDrawResult.wonPrizes[0].prizeLevel})
              </p>
              <p className="text-xs text-gray-500">
                抽獎時間: {new Date(staffDrawResult.wonPrizes[0].drawnAt).toLocaleString('zh-TW')}
              </p>
            </div>
          ) : (
            <div className="text-white">
              <p className="text-lg mb-2">
                <span className="text-yellow-500">員工編號：</span>{staffDrawResult.participant.staffNumber}
              </p>
              <p className="text-lg mb-2">
                <span className="text-yellow-500">姓名：</span>{staffDrawResult.participant.name}
              </p>
              <p className="text-lg mb-2">
                <span className="text-yellow-500">部門：</span>{staffDrawResult.participant.department}
              </p>
              <p className="text-white text-lg mt-4">未中獎，一起期待明年吧！</p>
            </div>
          )}
        </div>
      )}

      {/* 得獎者列表 */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-[95%] h-[calc(100%-10rem)] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {drawResults && Object.entries(drawResults.drawResults || {}).map(([rank, result]: [string, any]) => (
            <div key={rank} className="bg-gray-900 bg-opacity-90 border-2 border-yellow-500 rounded-xl p-6">
              {/* 獎項標題 */}
              <div className="mb-4">
                <h3 className="text-yellow-500 text-xl font-bold mb-2">{result.prize.name}</h3>
                <p className="text-gray-400 text-sm">獎項等級: {result.prize.rank} ({result.prize.prizeLevel})</p>
              </div>

              {/* 獎項圖片 */}
              <img
                src={result.prize.imageUrl}
                alt={result.prize.name}
                className="w-full h-48 object-contain rounded-lg mb-4"
              />

              {/* 得獎者列表 */}
              <div className="max-h-64 overflow-y-auto">
                <h4 className="text-white font-semibold mb-2">得獎者 ({result.winners.length}人)：</h4>
                <div className="space-y-2">
                  {result.winners.map((winner: any, index: number) => (
                    <div key={index} className="bg-gray-800 rounded p-3 text-sm">
                      <p className="text-white">
                        <span className="text-yellow-400">{winner.staffNumber}</span> - {winner.name}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {winner.department} ({winner.role === 'SENIOR' ? '資深' : '一般'})
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 抽獎時間 */}
              <p className="text-gray-500 text-xs mt-4">
                抽獎時間: {new Date(result.drawnAt).toLocaleString('zh-TW')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
