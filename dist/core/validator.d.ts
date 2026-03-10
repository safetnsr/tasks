import { AcceptanceCriterion } from '../types.js';
export interface ValidationResult {
    criterion: string;
    passed: boolean;
    detail?: string;
}
export declare function validateCriterion(criterion: AcceptanceCriterion, cwd: string): ValidationResult;
