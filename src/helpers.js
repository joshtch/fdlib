// FDlib Helpers

const INSPECT =
  typeof require === 'function'
    ? function(arg) {
        return require('util')
          .inspect(arg, { showHidden: false, depth: 100 })
          .replace(/\n ?/g, ' ');
      }
    : function(o) {
        return `${o}`;
      };

let TERM = console;
function setTerm(newTerm) {
  TERM = { ...TERM, ...newTerm };
}

function getTerm() {
  return TERM;
}

function _doNothing() {}

function SUSH() {
  const prevTerm = TERM;
  setTerm({
    log: _doNothing,
    warn: _doNothing,
    error: _doNothing,
    trace: _doNothing,
    time: _doNothing,
    timeEnd: _doNothing,
  });
  return prevTerm;
}

// Abstraction for throwing because throw statements cause deoptimizations
// All explicit throws should use this function. Also helps with tooling
// later, catching and reporting explicit throws and whatnot.

function THROW(...msg) {
  throw new Error(msg.join(': '));
}

export { INSPECT, SUSH, THROW, getTerm, setTerm };
