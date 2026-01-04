interface BonusPrizeRequest {
  name: string;
  total: number;
}

export const postApiCreateBonusPrize = async (raffleId: number, bonusPrizeData: BonusPrizeRequest) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/raffles/${raffleId}/bonus-prizes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bonusPrizeData),
    });

    if (response.ok) {
      console.log("Create bonus prize successfully!");
      return response.json();
    } else {
      console.log("Failed to create bonus prize!");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
