import { UserCredentials } from "../../types/UserCredentials";
import { getState } from "./state";

export function getUser(): UserCredentials | undefined {
    const state = getState();

    return state.user;
}