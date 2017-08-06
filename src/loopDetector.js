import {Loop} from "./loop";

export function LoopDetector(){
    this.loops = [];
}

LoopDetector.prototype.detect = function(messages){
    // Test Code
    var loopSet = [];
    loopSet.push(0);
    var stealthSet = new Set();
    stealthSet.add(1);
    stealthSet.add(2);
    var loop = new Loop(loopSet, stealthSet);
    var loops = [];
    loops.push(loop);

    this.loops = loops;
    return loops;
}

LoopDetector.prototype.getAllStealth = function(){
    var allStealthSet = new Set();
    this.loops.forEach(function(loop){
        concatSets(allStealthSet, loop.stealthSet);
    });
    return allStealthSet;
}

LoopDetector.prototype.getAllLoopStart = function(){
    var allLoopStartSet = new Set();
    this.loops.forEach(function(loop){
        allLoopStartSet.add(loop.loopSet[0]);
    });
    return allLoopStartSet;
}

LoopDetector.prototype.getAllLoopEnd = function(){
    var allLoopEndSet = new Set();
    this.loops.forEach(function(loop){
        allLoopEndSet.add(loop.loopSet[loop.loopSet.length - 1]);
    });
    return allLoopEndSet;
}

function concatSets(set1, set2){
    set2.forEach(function(item){
        set1.add(item);
    });
}
