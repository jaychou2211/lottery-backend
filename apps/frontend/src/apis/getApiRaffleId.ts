export const getApiRaffleId = async () => {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/raffles`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};