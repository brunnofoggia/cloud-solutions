import { Solution } from './solution.js';

export abstract class Secrets extends Solution {
    public defaultOptions: any = {
        cache: true
    };
    protected static cache: any = {};

    protected async get(path: string, fn: any) {
        if (this.options.cache) {
            if (!Secrets.cache[path]) {
                Secrets.cache[path] = await fn(path);
            }
            return Secrets.cache[path];
        }
        return await fn(path);
    }

    clearCache() {
        Secrets.cache = {};
    }
}