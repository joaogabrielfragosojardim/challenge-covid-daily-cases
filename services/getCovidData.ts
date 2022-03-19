import { api } from "./api";

export const getCovidData = async () => {
  const { data } = await api.get("/covidData");
  return data;
};

export const getCovidDataByDate = async (date: string) => {
  const { data } = await api.get("/covidData", {
    params: {
      date,
    },
  });
  return data;
};
