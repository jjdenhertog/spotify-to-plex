import { SearchConfig } from "../types/SearchConfig";
import { setState } from "./state/setState";

export function setConfig(config: SearchConfig) {
    setState({ config });
}