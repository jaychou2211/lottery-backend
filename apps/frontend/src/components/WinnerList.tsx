import { Transition } from '@headlessui/react';
// static resources
import { FaAngleLeft } from "react-icons/fa";

interface Winner {
  participantId: number;
  staffNumber: string;
  name: string;
  department: string;
  role: string;
  drawnGroup: string;
}

interface WinnerListProps {
  prizeName?: string;
  winners: Winner[];
  onClose: () => void;
}

export const WinnerList = ({ prizeName, winners, onClose }: WinnerListProps) => {
  return (
    <main className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      <div className="relative flex items-center justify-center px-2 py-4 flex-shrink-0">
        <button
          className="absolute left-0 top-0 text-2xl text-white flex items-center hover:text-gray-300 p-2"
          onClick={onClose}
        >
          <FaAngleLeft />
        </button>
        <h2 className="text-2xl font-bold text-white text-center">⭐ {prizeName} - 得獎者名單 ⭐</h2>
      </div>
      <div className="overflow-x-auto overflow-y-hidden px-2 pb-4 h-2/3">
        <div className="flex flex-col flex-wrap gap-2 h-full content-start pt-2">
          {winners.map((winner, index) => {
            return (
              <Transition
                key={index}
                appear={true}
                show={true}
                enter="transition-opacity duration-1000"
                enterFrom="opacity-0"
                enterTo="opacity-100"
              >
                <div className="flex-shrink-0 w-[20rem] h-[15%] p-2 bg-white text-black rounded-md">
                  <div className="flex justify-between items-center h-full">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{index + 1}</span>
                      <div className={`p-2 text-sm rounded-md ${winner.role === "SENIOR" ? 'bg-sky-300' : 'bg-lime-300'}`}>
                        {winner.role === "SENIOR" ? '資深' : '青年'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">{winner.name}</p>
                    </div>
                    <div className="p-2 text-sm rounded-md bg-[#EEEEEE]">
                      <div>{winner.department}</div>
                      <div>{winner.staffNumber}</div>
                    </div>
                  </div>
                </div>
              </Transition>
            );
          })}
        </div>
      </div>
    </main>
  );
};