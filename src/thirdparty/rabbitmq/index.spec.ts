import { RabbitMQ } from '.';

describe('RabbitMQ', () => {
    let events: RabbitMQ;

    beforeAll(() => {
        const providerOptions = {};
        events = new RabbitMQ(providerOptions);
    });

    describe('to be defined', () => {
        it('events', async () => {
            expect(events).toBeDefined();
        });
    });
});
