import { getAppBaseUrl } from "./appBaseUrl";

export const apiServerConfig = {
  baseUrl: process.env.API_SERVER_BASE_URL,
};

export const beatfolioBffConfig = {
  baseUrl: getAppBaseUrl(),
};
