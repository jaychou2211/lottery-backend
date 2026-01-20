export const getApiDrawResultByStaffId = async (raffleId: number, staffNumber: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/raffles/${raffleId}/participants/${staffNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("Get participant status successfully!");
      return response.json();
    } else {
      console.log("Failed to get participant status!");
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
