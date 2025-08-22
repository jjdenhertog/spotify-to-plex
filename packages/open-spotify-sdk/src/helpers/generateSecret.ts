import * as otp from "otpauth"

export default function generateSecret() {
    const now = Date.now()

    return otp.TOTP.generate({
        secret: getSecret(),
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        timestamp: now
    })
}

const getSecret = () => {
    const e = [12, 56, 76, 33, 88, 44, 88, 33, 78, 78, 11, 66, 22, 22, 55, 69, 54]
    // eslint-disable-next-line no-bitwise
    const t = e.map((e, t) => e ^ t % 33 + 9)

    const n = Buffer.from(t.join(""), "utf8").toString("hex")

    return otp.Secret.fromHex(n);
}