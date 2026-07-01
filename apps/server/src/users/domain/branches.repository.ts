export const BRANCHES_REPOSITORY = Symbol('BRANCHES_REPOSITORY');

export interface IBranchesRepository {
  existsById(id: number): Promise<boolean>;
}
