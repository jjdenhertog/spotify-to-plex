import deserialize from "../serialization/deserialize"
import { ClientToken } from "../types"

export default async function getClientToken(clientId: string) {
    const result = await fetch(`https://clienttoken.spotify.com/v1/clienttoken`, {
        method: 'POST',
        body: JSON.stringify({
            client_data: {
                client_version: "1.2.53.257.g47fa6c39",
                client_id: clientId,
                js_sdk_data: {}
            }
        }),
        headers: {
            accept: "application/json",
            "content-type": "application/json"
        }
    })

    return await deserialize<ClientToken>(result)
}