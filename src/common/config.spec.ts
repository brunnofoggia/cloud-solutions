import { adapters } from './config';
describe('adapters', () => {
    it('should have all adapters defined and not undefined', () => {
        let count = 0;
        let tests = 2;
        Object.keys(adapters).forEach((adapterCategory) => {
            Object.keys(adapters[adapterCategory]).forEach((adapterName) => {
                const adapter = adapters[adapterCategory][adapterName];
                if (!adapter) console.log(`adapterCategory: ${adapterCategory}, adapterName: ${adapterName} is undefined`);

                expect(adapter).toBeDefined();
                expect(adapter).not.toBeUndefined();
                count++;
            });
        });

        expect.assertions(count * tests);
    });
});
