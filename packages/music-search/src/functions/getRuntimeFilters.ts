import { getState } from "./state/getState";

export function getRuntimeFilters() {
    const state = getState();

    return state.runtimeFilters || [];
}