import axios from "axios";
import { Agent } from "node:https";

const agent = new Agent({ rejectUnauthorized: false });

export function axiosPut<T>(url: string, token: string) {
    return axios.put<T>(url, {},
        {
            httpsAgent: agent,
            headers: {
                'Accept': 'application/json',
                "X-Plex-Token": token,
            }
        }
    )
}