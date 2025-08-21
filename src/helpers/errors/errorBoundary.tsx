import { showError } from "../../components/ErrorProvider/ErrorProvider";
import { getErrorMessage } from "./getErrorMessage";
import { getErrorStack } from "./getErrorStack";

export async function errorBoundary(toRun: Function, onError?: Function, blockError?: boolean) {
    try {
        await toRun();
    } catch (err) {
        if (typeof onError == 'function') {
            try {
                onError(err);
            } catch (_e) { }
        }

        if (!blockError)
            showError(getErrorMessage(err), getErrorStack(err));
    }
}
