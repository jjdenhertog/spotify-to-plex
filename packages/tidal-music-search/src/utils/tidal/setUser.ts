import { UserCredentials } from "../../types/UserCredentials";
import { setState } from "./state";

export function setUser(user: UserCredentials | undefined): void {
    setState({ user });
}