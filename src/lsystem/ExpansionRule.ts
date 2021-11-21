export default class ExpansionRule {
  precondition: string;
  postcondition: string;
  postconditions: Map<number, string> = new Map();

  constructor(pre: string) {
    this.precondition = pre;
  }

  addPostCondition(prob: number, post: string) {
    this.postconditions.set(prob, post);
  }

  expand() {
    let num = Math.random();
    let prevThreshold = 0;

    for (let cond of Array.from(this.postconditions.entries())) {
      let prob = cond[0];
      let post = cond[1];

      let thisThreshold = prevThreshold + prob;
      if (num >= prevThreshold && num < thisThreshold) {
        return post;
      }

      prevThreshold = thisThreshold;
    }

    return this.precondition;
  }
}