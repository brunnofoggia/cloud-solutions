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
            // set what libraries you wanna use
            const solutionsOptions = {
                // will be set at first getting all solutions from that provider
                provider: 'aws',
                // the solutions specified below will replace the provider default
                // event management
                events: 'rabbitmq',
                // secret management
                secrets: '',
                // file storage
                storage: '',
                // provider options like region and access keys
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
