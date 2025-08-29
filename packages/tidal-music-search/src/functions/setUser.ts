import { setUser as setTidalUser } from "../utils/tidal/setUser";
import { UserCredentials } from "../types/UserCredentials";

export function setUser(user: UserCredentials | undefined): void {
    setTidalUser(user);
}