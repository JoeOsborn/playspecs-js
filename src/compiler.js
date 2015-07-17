/* @flow */

class Compiler {
    constructor() {}
    hello(a:number):string {
      return "hi";
    }
}

var c = new Compiler();

c.hello(5);

c.hello(6);