export const getApiRaffleId = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/raffles`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};