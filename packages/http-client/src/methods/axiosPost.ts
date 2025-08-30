import axios from "axios";
import { Agent } from "node:https";

const agent = new Agent({ rejectUnauthorized: false });

export function axiosPost<T>(url: string, token: string) {
    return axios.post<T>(url, {},
        {
            httpsAgent: agent,
            headers: {
                'Accept': 'application/json',
                "X-Plex-Token": token,
            }
        }
    )
}