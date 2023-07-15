import dotenv from 'dotenv';
import { SolutionsFactory } from '.';

describe('Solutions Factory', () => {
    let solutions: SolutionsFactory;

    // beforeAll(() => {
    // });

    describe('config', () => {
        it('random test to check abstract/config file', async () => {
            dotenv.config({ path: 'test/env/aws/.env' });
            const _solutions = new SolutionsFactory();
            const solutionsOptions = {
                provider: 'aws',
                events: 'rabbitmq',
                secrets: '',
                storage: '',
                providerOptions: {
                    region: process.env.CLOUD_REGION,
                    user: process.env.CLOUD_USER,
                    pass: process.env.CLOUD_PASS,
                },
            };

            const { storage, secrets, events } = await _solutions.initialize(solutionsOptions);
            expect(_solutions).toBeDefined();
            expect(storage).toBeDefined();
            expect(secrets).toBeDefined();
            expect(events).toBeDefined();
        });

        it('random test to check abstract/config file', async () => {
            dotenv.config({ path: 'test/env/aws/.env' });
            const _solutions = new SolutionsFactory();
            const solutionsOptions = {
                provider: 'aws',
                events: 'rabbitmq',
                secrets: 'env',
                storage: 'fs',
                providerOptions: {
                    region: process.env.CLOUD_REGION,
                    user: process.env.CLOUD_USER,
                    pass: process.env.CLOUD_PASS,
                },
            };

            const { storage, secrets, events } = await _solutions.initialize(solutionsOptions);
            expect(_solutions).toBeDefined();
            expect(storage).toBeDefined();
            expect(secrets).toBeDefined();
            expect(events).toBeDefined();
        });
    });
});
