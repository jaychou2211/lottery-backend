export const getApiPrize = async (raffleId: number) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/raffles/${raffleId}?include=drawProgress`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("Load raffle data successfully!");
      return response.json();
    } else {
      console.log("Failed to load raffle data!");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};