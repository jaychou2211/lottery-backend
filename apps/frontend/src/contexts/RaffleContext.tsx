import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getApiRaffleId } from '../apis/getApiRaffleId';

interface RaffleContextType {
  raffleId: number;
}

const RaffleContext = createContext<RaffleContextType | undefined>(undefined);

export const RaffleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [raffleId, setRaffleId] = useState<number>(1);

  useEffect(() => {
    const loadRaffleId = async () => {
      try {
        const raffles = await getApiRaffleId();
        if (raffles && raffles.length > 0) {
          const currentRaffleId = raffles[0].id;
          setRaffleId(currentRaffleId);
          console.log('Raffle ID loaded:', currentRaffleId);
        }
      } catch (error) {
        console.error('Failed to load raffle ID:', error);
      }
    };

    loadRaffleId();
  }, []);

  return (
    <RaffleContext.Provider value={{ raffleId }}>
      {children}
    </RaffleContext.Provider>
  );
};

export const useRaffleContext = () => {
  const context = useContext(RaffleContext);
  if (context === undefined) {
    throw new Error('useRaffleContext must be used within a RaffleProvider');
  }
  return context;
};
