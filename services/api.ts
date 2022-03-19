import axios from "axios";

export const api = axios.create({
  baseURL: "https://covid-fake-api-jgfj.herokuapp.com",
});
