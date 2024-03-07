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

