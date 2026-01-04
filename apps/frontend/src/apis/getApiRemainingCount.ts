export const getApiRemainingCount = async (raffleId: number) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/raffles/${raffleId}?include=remainingCount`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("Load remaining count data successfully!");
      return response.json();
    } else {
      console.log("Failed to load remaining count data!");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};