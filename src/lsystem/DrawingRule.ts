import Drawable from "../rendering/gl/Drawable";

export default class DrawingRule {
  symbol: string;
  drawable: Drawable;
  ruleFunc: any;

  constructor(sym: string, draw: Drawable, rule: any) {
    this.symbol = sym;
    this.drawable = draw;
    this.ruleFunc = rule;
  }

  draw() {
    return this.ruleFunc();
  }
}