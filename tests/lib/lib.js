import {
  domain_arrToSmallest,
  domain_size,
} from '../../src/domain';

function countSolutions(solver) {
  const { solutions } = solver;
  let total = 0;
  for (let i = 0, n = solutions.length; i < n; ++i) {
    const solution = solutions[i];
    const keys = Object.keys(solution);
    let sub = 1;
    for (let j = 0, m = keys.length; j < m; ++j) {
      const key = keys[j];
      const value = solution[key];
      if (value === false) {
        sub = 0;
        break;
      }

      if (Array.isArray(value)) sub *= domain_size(domain_arrToSmallest(value));
    }

    total += sub;
  }

  return total;
}

export {
  countSolutions,
};
