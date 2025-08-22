import { createContext } from "react";
const noOp = () => {
    return new Promise((resolve, _reject) => { resolve(); });
};
export const ConfirmContext = createContext({
    confirm: noOp
});
//# sourceMappingURL=ConfirmContext.jsx.map