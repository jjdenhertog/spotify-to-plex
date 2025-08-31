import { UserCredentials } from "../../types/UserCredentials";

type TidalAPIState = {
    accessToken?: string;
    expiresAt?: number;
    user?: UserCredentials;
    clientId?: string;
    clientSecret?: string;
}

const state: TidalAPIState = {
    accessToken: undefined,
    expiresAt: undefined,
    user: undefined,
    clientId: undefined,
    clientSecret: undefined
};

export function getState(): TidalAPIState {
    return state;
}

export function setState(newState: Partial<TidalAPIState>): void {
    Object.assign(state, newState);
}

