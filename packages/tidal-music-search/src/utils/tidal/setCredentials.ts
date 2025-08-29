import { setState } from "./state";

export function setCredentials(clientId: string, clientSecret: string): void {
    setState({ clientId, clientSecret });
}