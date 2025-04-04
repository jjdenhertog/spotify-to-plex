import { createContext } from "react"
import { ProviderContext } from "./types"

const noOp = () => {
    return new Promise<void>((resolve, _reject) => { resolve() })
}
export const ConfirmContext = createContext<ProviderContext>({
    confirm: noOp
})
