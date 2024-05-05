import { createContext } from "react"
import { ProviderContext } from "./types"

const noOp = () => {}
export const ErrorContext = createContext<ProviderContext>({
    showError: noOp
})
