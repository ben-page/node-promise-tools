export class PromiseTimeoutError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
    }
}

export class PromiseCancellationError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
    }
}

export function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function cancelable(promise, constructorOpt) {
    if (!(promise instanceof Promise))
        throw new Error('expected a Promise');

    const cancelError = new PromiseCancellationError();
    Error.captureStackTrace(cancelError, constructorOpt);

    let cancel;
    const p = new Promise((resolve, reject) => {
        promise.then(resolve, reject);
        cancel = () => reject(cancelError);
    });
    p.cancel = () => cancel();
    return p;
}

export function timeout(promise, ms, constructorOpt) {
    if (!(promise instanceof Promise))
        throw new Error('expected a Promise');

    const timeoutError = new PromiseTimeoutError();
    Error.captureStackTrace(timeoutError, constructorOpt);

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(timeoutError);
        }, ms);

        promise
            .then(result => {
                clearTimeout(timeout);
                resolve(result);
            }, err => {
                clearTimeout(timeout);
                reject(err);
            });
    });
}

export async function map(array, fn) {
    const promises = [];
    const results = [];

    for (let i = 0; i < array.length; i++) {
        const p = (async () => {
            const item = array[i];
            results[i] = await fn.call(item, item, i);
        })();
        promises.push(p);
    }

    await Promise.all(promises);
    return results;
}

export async function mapSeries(array, fn) {
    const promises = [];
    const results = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        results[i] = await fn.call(item, item, i);
    }

    await Promise.all(promises);
    return results;
}

export async function each(array, fn) {
    for (let i = 0; i < array.length; i++) {
        const item = array[i];
        await fn.call(item, item, i, array);
    }
}

export function fromCallback(fn) {
    return new Promise((resolve, reject) => {
        try {
            fn((...args) => {
                if (args && args.length > 0 && args[0])
                    reject(args[0]);
                else if (args && args.length > 1 && args[1])
                    resolve(args[1]);
                else
                    resolve(undefined);
            });
        } catch (err) {
            reject(err);
        }
    });
}

export function newPromise(fn) {
    return new Promise((resolve, reject) => {
        try {
            fn(resolve, reject);
        } catch (err) {
            reject(err);
        }
    });
}

export function promisify(fn, context) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            try {
                args.push((...result) => {
                    if (result && result.length > 0 && result[0])
                        reject(result[0]);
                    else if (result && result.length > 1 && result[1])
                        resolve(result[1]);
                    else
                        resolve(undefined);
                });
                fn.apply(context, args);
            } catch (err) {
                reject(err);
            }
        });
    };
}

export function makeDeferrable(deferred) {
    return new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
}
