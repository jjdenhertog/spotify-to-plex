export function getErrorStack(e) {
    const error = e;
    return error.response?.data?.stack || error.response?.data?.error_stack || error.stack;
}
//# sourceMappingURL=getErrorStack.jsx.map