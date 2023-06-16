import { EventsInterface } from '../../common/interfaces/events.interface';
import { Events } from '../../common/abstract/events';

export class QueueMock extends Events implements EventsInterface {

    async loadQueue(_name, _handler) {
        return;
    }

    ack(name, message, options) {
        return;
    }

    nack(name, message, options) {
        return;
    }

}