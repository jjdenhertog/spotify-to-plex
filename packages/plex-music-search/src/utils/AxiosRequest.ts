import axios, { AxiosRequestConfig } from "axios";
import { Agent } from "node:https";

const agent = new Agent({ rejectUnauthorized: false });

export const AxiosRequest = {
    get<T>(url: string, token: string, config: AxiosRequestConfig = {}) {
        return axios.get<T>(url,
            {
                ...config,
                httpsAgent: agent,
                headers: {
                    "X-Plex-Token": token,
                }
            }
        )
    },
    post<T>(url: string, token: string) {
        return axios.post<T>(url, {},
            {
                httpsAgent: agent,
                headers: {
                    'Accept': 'application/json',
                    "X-Plex-Token": token,
                }
            }
        )
    },
    put<T>(url: string, token: string) {
        return axios.put<T>(url, {},
            {
                httpsAgent: agent,
                headers: {
                    'Accept': 'application/json',
                    "X-Plex-Token": token,
                }
            }
        )
    },
    delete<T>(url: string, token: string) {
        return axios.delete<T>(url,
            {
                httpsAgent: agent,
                headers: {
                    'Accept': 'application/json',
                    "X-Plex-Token": token,
                }
            }
        )
    }
}