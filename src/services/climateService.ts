const API_KEY = import.meta.env.VITE_NOAA_API_KEY;

export async function getDatasets() {
  const response = await fetch(
    "https://www.ncei.noaa.gov/cdo-web/api/v2/datasets",
    {
      headers: {
        token: API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch datasets");
  }

  return response.json();
}