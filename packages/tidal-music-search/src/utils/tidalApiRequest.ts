import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import qs from "qs";

export default async function tidalApiRequest<T = any>(accessToken: string, url: string, params: AxiosRequestConfig['params'], retry: number = 0): Promise<AxiosResponse<T>> {


    try {
        const result = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params,
            paramsSerializer: params => {
                return qs.stringify(params, { arrayFormat: "repeat" })
            }
        });

        const remainingTokens = parseInt(result.headers['x-ratelimit-remaining'], 10);
        const replenishRate = parseInt(result.headers['x-ratelimit-replenish-rate'], 10);
        const requestedTokens = parseInt(result.headers['x-ratelimit-requested-tokens'], 10);

        const waitTime = calculateWaitTime(remainingTokens, replenishRate, requestedTokens);
        await delay(waitTime * 1000);

        return result;

    } catch (error) {
        if (error instanceof AxiosError && error.response && error.response.status === 429) {

            const remainingTokens = parseInt(error.response.headers['x-ratelimit-remaining'], 10);
            const replenishRate = parseInt(error.response.headers['x-ratelimit-replenish-rate'], 10);
            const requestedTokens = parseInt(error.response.headers['x-ratelimit-requested-tokens'], 10);

            // Calculate necessary wait time if tokens are insufficient
            let waitTime = calculateWaitTime(remainingTokens, replenishRate, requestedTokens);
            waitTime += 1;
            if (retry == 1)
                waitTime += 2;

            if (retry == 2)
                throw new Error(`Rate limit exceeded`)

            await delay(waitTime * 1000);

            return tidalApiRequest(accessToken, url, params, retry + 1)

        } else if (error instanceof AxiosError) {
            throw new Error(`Failed Tidal API query: ${JSON.stringify(error.response?.data)}`);
        } else {
            throw error;
        }
    }
}



async function delay(ms: number) {
    return new Promise(resolve => { setTimeout(resolve, ms) });
}

function calculateWaitTime(remainingTokens: number, replenishRate: number, requestedTokens: number) {
    if (remainingTokens >= requestedTokens) return 0;

    const tokensNeeded = requestedTokens - remainingTokens;
    const waitTime = Math.ceil(tokensNeeded / replenishRate);

    return waitTime;
}
