import { IamResponse } from '../interfaces/iam.interface';
import { Solution } from './solution';

export const IamDefaultOptions = {};

export abstract class Iam extends Solution {
    public defaultOptions: any = IamDefaultOptions;
}
