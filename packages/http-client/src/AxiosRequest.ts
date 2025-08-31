/* eslint-disable custom/no-export-only-files */
import axios, { AxiosRequestConfig } from "axios";
import { Agent } from "node:https";

const agent = new Agent({ rejectUnauthorized: false });

function axiosGet<T>(url: string, token: string, config: AxiosRequestConfig = {}) {
    return axios.get<T>(url, {
        ...config,
        // eslint-disable-next-line unicorn/numeric-separators-style
        timeout: 10000,
        httpsAgent: agent,
        headers: {
            "X-Plex-Token": token,
        }
    });
}

function axiosPost<T>(url: string, token: string) {
    return axios.post<T>(url, {}, {
        httpsAgent: agent,
        headers: {
            'Accept': 'application/json',
            "X-Plex-Token": token,
        }
    });
}

function axiosPut<T>(url: string, token: string) {
    return axios.put<T>(url, {}, {
        httpsAgent: agent,
        headers: {
            'Accept': 'application/json',
            "X-Plex-Token": token,
        }
    });
}

function axiosDelete<T>(url: string, token: string) {
    return axios.delete<T>(url, {
        httpsAgent: agent,
        headers: {
            'Accept': 'application/json',
            "X-Plex-Token": token,
        }
    });
}

export const AxiosRequest = {
    get: axiosGet,
    post: axiosPost,
    put: axiosPut,
    delete: axiosDelete
}