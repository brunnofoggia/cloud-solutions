export const sleep = (ms: number) => {
    return new Promise((resolve) => {
        const timeout = setTimeout(resolve, ms);
        timeout.unref();
    });
};
