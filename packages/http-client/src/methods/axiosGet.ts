import axios, { AxiosRequestConfig } from "axios";
import { Agent } from "node:https";

const agent = new Agent({ rejectUnauthorized: false });

export function axiosGet<T>(url: string, token: string, config: AxiosRequestConfig = {}) {
    return axios.get<T>(url,
        {
            ...config,
            // eslint-disable-next-line unicorn/numeric-separators-style
            timeout: 10000,
            httpsAgent: agent,
            headers: {
                "X-Plex-Token": token,
            }
        }
    )
}