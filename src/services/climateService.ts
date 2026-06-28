export type LiveClimateDatasetKey = "co2" | "temperature" | "seaLevel";

export type LiveClimatePoint = {
  timestamp: number;
  value: number;
};

export type HighestTemperatureToday = {
  countryCode: string;
  location: string;
  value: number;
};

export type HighestPollutionArea = {
  location: string;
  pm25: number | null;
  usAqi: number;
};

export type ClimateHeadline = {
  source: string;
  title: string;
  url: string;
};

const noaaApiKey = import.meta.env.VITE_NOAA_API_KEY;

const monitoredHotspots = [
  { name: "Death Valley, United States", countryCode: "US", latitude: 36.46, longitude: -116.87 },
  { name: "Phoenix, United States", countryCode: "US", latitude: 33.45, longitude: -112.07 },
  { name: "Kuwait City, Kuwait", countryCode: "KW", latitude: 29.38, longitude: 47.98 },
  { name: "Basra, Iraq", countryCode: "IQ", latitude: 30.51, longitude: 47.78 },
  { name: "Doha, Qatar", countryCode: "QA", latitude: 25.29, longitude: 51.53 },
  { name: "Riyadh, Saudi Arabia", countryCode: "SA", latitude: 24.71, longitude: 46.68 },
  { name: "Jacobabad, Pakistan", countryCode: "PK", latitude: 28.28, longitude: 68.44 },
  { name: "Dallol, Ethiopia", countryCode: "ET", latitude: 14.24, longitude: 40.3 },
  { name: "Oodnadatta, Australia", countryCode: "AU", latitude: -27.55, longitude: 135.45 },
  { name: "Timbuktu, Mali", countryCode: "ML", latitude: 16.77, longitude: -3.01 },
];

const monitoredPollutionAreas = [
  { name: "Delhi, India", latitude: 28.61, longitude: 77.21 },
  { name: "Lahore, Pakistan", latitude: 31.52, longitude: 74.36 },
  { name: "Dhaka, Bangladesh", latitude: 23.81, longitude: 90.41 },
  { name: "Ulaanbaatar, Mongolia", latitude: 47.92, longitude: 106.92 },
  { name: "Kuwait City, Kuwait", latitude: 29.38, longitude: 47.98 },
  { name: "Cairo, Egypt", latitude: 30.04, longitude: 31.24 },
  { name: "Jakarta, Indonesia", latitude: -6.2, longitude: 106.85 },
  { name: "Beijing, China", latitude: 39.9, longitude: 116.41 },
  { name: "Mexico City, Mexico", latitude: 19.43, longitude: -99.13 },
  { name: "Los Angeles, United States", latitude: 34.05, longitude: -118.24 },
];

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTimestamp(year: unknown, month: unknown = 1, day: unknown = 1) {
  const parsedYear = toNumber(year);
  const parsedMonth = toNumber(month);
  const parsedDay = toNumber(day);

  if (!parsedYear || !parsedMonth || !parsedDay) {
    return null;
  }

  return new Date(parsedYear, parsedMonth - 1, parsedDay).getTime();
}

function sortAndDedupe(points: LiveClimatePoint[]) {
  const pointMap = new Map<number, LiveClimatePoint>();

  points.forEach((point) => {
    pointMap.set(point.timestamp, point);
  });

  return [...pointMap.values()].sort((a, b) => a.timestamp - b.timestamp);
}

function parseCo2Response(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("co2" in payload) ||
    !Array.isArray(payload.co2)
  ) {
    return [];
  }

  return sortAndDedupe(
    payload.co2.flatMap((point) => {
      const timestamp = toTimestamp(point.year, point.month, point.day);
      const value = toNumber(point.trend ?? point.cycle);

      if (!timestamp || value === null) {
        return [];
      }

      return [{ timestamp, value }];
    })
  );
}

function parseTemperatureResponse(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("result" in payload) ||
    !Array.isArray(payload.result)
  ) {
    return [];
  }

  return sortAndDedupe(
    payload.result.flatMap((point) => {
      const time = toNumber(point.time);
      const value = toNumber(point.station ?? point.land);

      if (time === null || value === null) {
        return [];
      }

      const year = Math.trunc(time);
      const month = Math.max(1, Math.round((time - year) * 12));
      const timestamp = toTimestamp(year, month);

      if (!timestamp) {
        return [];
      }

      return [{ timestamp, value }];
    })
  );
}

function parseHighestTemperatureResponse(payload: unknown) {
  if (!Array.isArray(payload)) {
    return null;
  }

  const readings = payload.flatMap((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("daily" in item) ||
      typeof item.daily !== "object" ||
      item.daily === null ||
      !("temperature_2m_max" in item.daily) ||
      !Array.isArray(item.daily.temperature_2m_max)
    ) {
      return [];
    }

    const value = toNumber(item.daily.temperature_2m_max[0]);

    if (value === null) {
      return [];
    }

    const hotspot = monitoredHotspots[index];

    return [
      {
        countryCode: hotspot?.countryCode ?? "US",
        location: hotspot?.name ?? "Monitored location",
        value,
      },
    ];
  });

  return readings.reduce<HighestTemperatureToday | null>((highest, reading) => {
    if (!highest || reading.value > highest.value) {
      return reading;
    }

    return highest;
  }, null);
}

function parseHighestPollutionResponse(payload: unknown) {
  if (!Array.isArray(payload)) {
    return null;
  }

  const readings = payload.flatMap((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("current" in item) ||
      typeof item.current !== "object" ||
      item.current === null
    ) {
      return [];
    }

    const usAqi = toNumber(item.current.us_aqi);
    const pm25 = toNumber(item.current.pm2_5);

    if (usAqi === null) {
      return [];
    }

    return [
      {
        location: monitoredPollutionAreas[index]?.name ?? "Monitored area",
        pm25,
        usAqi,
      },
    ];
  });

  return readings.reduce<HighestPollutionArea | null>((highest, reading) => {
    if (!highest || reading.usAqi > highest.usAqi) {
      return reading;
    }

    return highest;
  }, null);
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json();
}

async function fetchText(url: string, init?: RequestInit) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.text();
}

export async function getDatasets() {
  if (!noaaApiKey) {
    throw new Error("Missing VITE_NOAA_API_KEY");
  }

  return fetchJson("https://www.ncei.noaa.gov/cdo-web/api/v2/datasets", {
    headers: {
      token: noaaApiKey,
    },
  });
}

export async function fetchLiveClimateSeries(key: LiveClimateDatasetKey) {
  if (key === "co2") {
    const payload = await fetchJson("https://global-warming.org/api/co2-api");
    return parseCo2Response(payload);
  }

  if (key === "temperature") {
    const payload = await fetchJson("https://global-warming.org/api/temperature-api");
    return parseTemperatureResponse(payload);
  }

  return [];
}

export async function fetchHighestTemperatureToday() {
  const latitudes = monitoredHotspots.map((location) => location.latitude).join(",");
  const longitudes = monitoredHotspots.map((location) => location.longitude).join(",");
  const query = new URLSearchParams({
    latitude: latitudes,
    longitude: longitudes,
    daily: "temperature_2m_max",
    timezone: "UTC",
    forecast_days: "1",
  });
  const payload = await fetchJson(`https://api.open-meteo.com/v1/forecast?${query}`);
  const highest = parseHighestTemperatureResponse(payload);

  if (!highest) {
    throw new Error("No highest temperature reading available");
  }

  return highest;
}

export async function fetchHighestPollutionArea() {
  const latitudes = monitoredPollutionAreas
    .map((location) => location.latitude)
    .join(",");
  const longitudes = monitoredPollutionAreas
    .map((location) => location.longitude)
    .join(",");
  const query = new URLSearchParams({
    latitude: latitudes,
    longitude: longitudes,
    current: "us_aqi,pm2_5",
    timezone: "UTC",
  });
  const payload = await fetchJson(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${query}`
  );
  const highest = parseHighestPollutionResponse(payload);

  if (!highest) {
    throw new Error("No pollution reading available");
  }

  return highest;
}

export async function fetchTopClimateHeadline() {
  const query = new URLSearchParams({
    query: "climate change",
    mode: "ArtList",
    format: "json",
    sort: "DateDesc",
    maxrecords: "1",
    timespan: "3d",
  });
  const text = await fetchText(
    `https://api.gdeltproject.org/api/v2/doc/doc?${query}`
  );
  const payload = JSON.parse(text) as {
    articles?: Array<{
      domain?: string;
      title?: string;
      url?: string;
    }>;
  };
  const article = payload.articles?.find((item) => item.title && item.url);

  if (!article?.title || !article.url) {
    throw new Error("No climate headline available");
  }

  return {
    source: article.domain ?? "News search",
    title: article.title,
    url: article.url,
  };
}
