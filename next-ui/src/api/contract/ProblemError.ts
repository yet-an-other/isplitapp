/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-misused-new */

export interface ProblemError extends Error {

    new (json: any): ProblemError;

    errors: any

    status: number

    title: string

    type: string
}

export class ProblemError implements ProblemError {
    constructor(json: any) {
        return json as ProblemError;
    }
}


