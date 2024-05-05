import {AxiosError, AxiosRequestConfig, AxiosResponse} from "axios";
import {Logger} from "../util/Logger";
import {configuredAxios} from "../extensions/http/configured-axios";
import {kebabCase} from "lodash";
import {enqueueSnackbar} from "notistack";

configuredAxios.interceptors.request.use((requestConfig: any) => {
  requestConfig.metadata = {startTime: new Date()};
  return requestConfig;
});

configuredAxios.interceptors.response.use(
  (response: any) => {
    response.config.metadata.endTime = new Date();
    response.config.metadata.requestTime = response.config.metadata.endTime - response.config.metadata.startTime;
    return response;
  },
  (error: any) => {
    if (error.response) {
      error.response.config.metadata.endTime = new Date();
      error.response.config.metadata.requestTime =
        error.response.config.metadata.endTime - error.response.config.metadata.startTime;
    }

    return Promise.reject(error);
  },
);

export const sendApiRequest = async (
  requestConfig: AxiosRequestConfig,
) => {
  try {
    return configuredAxios(requestConfig);
  } catch (error) {
    Logger.error(error);
    throw error;
  }
};

const executeCommand = async (commandName: string, payload: any): Promise<AxiosResponse> => {
  const [service, cmd] = commandName.split(".");

  return sendApiRequest({
    url: `/api/${kebabCase(service)}/messages/${kebabCase(cmd)}`,
    method: 'post',
    data: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const executeEvent = async (eventName: string, payload: any): Promise<AxiosResponse> => {
  const parts = eventName.split(".");
  const service = parts[0];

  const eventUrl = eventName.split(".").slice(1).map(p => kebabCase(p)).join("/");
  return sendApiRequest({
    url: `/api/${kebabCase(service)}/${eventUrl}`,
    method: 'post',
    data: payload,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const queryErrorTimers: Record<string, number> = {};

async function executeQuery<T = any>(queryName: string, payload: any): Promise<AxiosResponse<T>> {
  const [service, query] = queryName.split(".");
  const timerKey = queryName + JSON.stringify(payload);

  try {
    if (queryErrorTimers[timerKey]) {
      window.clearTimeout(queryErrorTimers[timerKey]);
    }

    const response = await sendApiRequest({
      url: `/api/${kebabCase(service)}/messages/${kebabCase(query)}`,
      method: 'get',
      params: payload,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status >= 400) {
      queryErrorTimers[timerKey] = window.setTimeout(() => {
        enqueueSnackbar(`Query "${queryName}" failed with status: ${response.status}`, {variant: "error"});
      }, response.status === 504 ? 5000 : 1000);
    }

    return response;
  } catch (e) {
    if (e instanceof AxiosError) {
      queryErrorTimers[timerKey] = window.setTimeout(() => {
        enqueueSnackbar(`Query "${queryName}" failed with status: ${(e as AxiosError).response?.status || 500}. See browser logs for details`, {variant: "error"});
      }, (e as AxiosError).response?.status === 504 ? 5000 : 1000);
    }

    throw e;
  }
}

export const Api = {
  executeCommand,
  executeQuery,
  executeEvent,
};
