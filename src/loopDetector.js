import {Loop} from "./loop";

export function LoopDetector(){
    this.loops = [];
}

LoopDetector.prototype.detect = function(messages){
    // Test Code
    var loopSet = [];
    var stealthSet = new Set();

    if(messages.length < 2)
        return [new Loop(loopSet, stealthSet)];
    if(messages[0].equals(messages[1]))
        loopSet.push(0);
    for(var i = 1; i < messages.length; i++){
        if(messages[0].equals(messages[i]))
            stealthSet.add(i);
    }
    var loop = new Loop(loopSet, stealthSet);
    var loops = [];
    loops.push(loop);

    // Tanikuchis' approach
    /*
    var loopSet = [];
    var stealthSet = new Set();
    var loops = [];
    for(var k = 1; k < messages.length / 2; k++){
        for(var j = 0; j < messages.length - k - 1; j++){
            var flag = true;
            for(var i = 0; i < k; i++){
                console.log(messages[k+i+j]);
                console.log(i,j,k);
                if(!messages[i + j].equals(messages[k + i + j])){
                    flag = false;
                    break;
                }
            }
            if(flag){
                if(!stealthSet.has(j)){ // a new detected loop
                    if(loopSet.length != 0){
                        var loop = new Loop(loopSet, stealthSet);
                        loops.push(loop);
                    }
                    for(var i = j; i < j + k; i++)
                        loopSet.push(i);
                    for(var i = j + k; i < j + 2 * k; i++)
                        stealthSet.add(i);
                }
                else{ // a new member for exist loop
                    for(var i = j + k; i < j + 2 * k; i++)
                        stealthSet.add(i);
                }
            }
            else{
                if(loopSet.length != 0){
                    var loop = new Loop(loopSet, stealthSet);
                    loops.push(loop);
                }
            }
        }
    }*/

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
