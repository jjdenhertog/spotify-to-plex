import { RuntimeMatchFilter } from "../types/config";
import { getState } from "./state/getState";

export function getRuntimeFilters(): RuntimeMatchFilter[] {
    const state = getState();

    return state.runtimeFilters || [];
}