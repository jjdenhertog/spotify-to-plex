import generateSecret from "../helpers/generateSecret"
import deserialize from "../serialization/deserialize"
import { AccessToken } from "../types"

export default async function getAccessToken() {
    const totp = generateSecret() 
    const totpServer = generateSecret()

    const result = await fetch(`https://open.spotify.com/get_access_token?reason=init&productType=web-player&totp=${totp}&totpServer=${totpServer}&totpVer=5&sTime=1743063046&cTime=1743063047192&buildVer=web-player_2025-03-27_1743057394716_7cfd796&buildDate=2025-03-27`)

    return await deserialize<AccessToken>(result)
}