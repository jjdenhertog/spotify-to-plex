import { RuntimeMatchFilter } from "../types/RuntimeMatchFilter";
import { getState } from "./state/getState";

export function getRuntimeFilters(): RuntimeMatchFilter[] {
    const state = getState();

    return state.runtimeFilters || [];
}