import { createContext } from "react"
import { ProviderContext } from "./types"

const noOp = () => {
    // Default no-op function for context
}
export const ErrorContext = createContext<ProviderContext>({
    showError: noOp
})
