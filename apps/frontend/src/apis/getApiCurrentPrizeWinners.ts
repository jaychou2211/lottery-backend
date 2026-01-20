export const getApiCurrentPrizeWinners = async (raffleId: number, rank: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/raffles/${raffleId}/draw?rank=${rank}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("Draw winners successfully!");
      return response.json();
    } else {
      console.log("Failed to draw winners!");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
