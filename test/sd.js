(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.sd = {})));
}(this, (function (exports) { 'use strict';

var ELEMENT_HEIGHT$2 = 40;
var ELEMENT_CH_WIDTH$2 = 10;
var PADDING$2 = 20;

function Element(rawElement) {
    // Display information
    this.id = rawElement.id;
    this.displayName = rawElement.name;
    if(rawElement.type != undefined){ // objects
        this.displayName += rawElement.type;
    }

    // Grouping information
    this.parent = -1;
    this.children = [];
    this.fold = true;

    // Position infromation
    this.x = 0;
    this.y = 0;
    this.height = ELEMENT_HEIGHT$2;
    this.width = this.displayName.length * ELEMENT_CH_WIDTH$2 + PADDING$2 * 2;
}

Element.prototype.isGroup = function () {
    return this.children.length != 0;
};

var ELEMENT_CH_WIDTH$1 = 10;
var PADDING$1 = 20;
var PADDING_GROUP$1 = 10;

var elementMap = []; // [id => element]
var display = [];

function initElements(objects, groups) {
    elementMap = new Map();
    // Add objects
    objects.forEach(function(object) {
        var e = new Element(object);
        elementMap.set(e.id, e);
    });

    // Add group information
    groups.forEach(function(group) {
        var e = new Element(group);
        e.children = group.objs;
        elementMap.set(e.id, e);

        objects = group.objs;
        for(var i = 0; i < objects.length; i++) {
            var thisElement = elementMap.get(objects[i]);
            thisElement.parent = group.id;
        }
    });
}

function ElementController(objects, groups){
    initElements(objects, groups);

    elementMap.forEach(function(element, key, map){
        if(element.parent == -1)
            display.push(element);
    });

    // Sort by such a rule: put a group at where 1st object in it should be
    display.sort(function(a, b){
        var ida = a.id;
        var idb = b.id;
        if(a.isGroup()) ida = a.children[0];
        if(b.isGroup()) idb = b.children[0];
        return ida - idb;
    });

    // Decide the position of elements
    var dist = PADDING$1;
    for(var i = 0; i < display.length; i++){
        display[i].x = dist;
        dist += (display[i].width + PADDING$1);
    }
}

ElementController.prototype.getElementMap = function(){
    return elementMap;
};

ElementController.prototype.getDisplay = function(){
    return display;
};

ElementController.prototype.unfoldUpdateStatus = function(groupId){
    var thisGroup = elementMap.get(groupId);
    if(!thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var dist = PADDING_GROUP$1;
    var index = display.indexOf(thisGroup) + 1;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = elementMap.get(elementIds[i]);
        thisElement.x = dist + thisGroup.x;
        display.splice(index, 0, thisElement);
        index++;
        dist += (thisElement.width + PADDING$1);
    }

    var diff = dist - PADDING$1 + PADDING_GROUP$1 - thisGroup.width;
    while(index < display.length){
        display[index].x += diff;
        index++;
    }

    thisGroup.width += diff;
    thisGroup.y -= PADDING_GROUP$1;
    thisGroup.height += (2 * PADDING_GROUP$1);
    thisGroup.fold = false;

    // If there are parent groups
    var tempGroup = thisGroup;
    while(tempGroup.parent != -1){
        tempGroup = elementMap.get(tempGroup.parent);
        tempGroup.width += diff;
        tempGroup.height += (2 * PADDING_GROUP$1);
        tempGroup.y -= PADDING_GROUP$1;
    }
};

ElementController.prototype.foldUpdateStatus = function(groupId){
    var thisGroup = elementMap.get(groupId);
    if(thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var index = 0;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = elementMap.get(elementIds[i]);
        index = display.indexOf(thisElement);
        display.splice(index, 1); // Remove elements in group from display
    }

    var diff = thisGroup.width - (thisGroup.displayName.length * ELEMENT_CH_WIDTH$1 + PADDING$1 * 2);
    while(index < display.length){
        display[index].x -= diff;
        index++;
    }

    thisGroup.width -= diff;
    thisGroup.y += PADDING_GROUP$1;
    thisGroup.height -= (2 * PADDING_GROUP$1);
    thisGroup.fold = true;

    // If there are parent groups
    var tempGroup = thisGroup;
    while(tempGroup.parent != -1){
        tempGroup = elementMap.get(tempGroup.parent);
        tempGroup.width -= diff;
        tempGroup.height -= (2 * PADDING_GROUP$1);
        tempGroup.y += PADDING_GROUP$1;
    }
};

// represent: an array of messages
// repeat: repeat times
function LoopNode(represent, repeat){
    this.represent = represent;
    this.repeat = repeat;
    this.children = [];
    this.depth = 1;
}

LoopNode.prototype.sameRepresent = function(another){
    if(this.represent.length != another.represent.length){
        return false;
    }
    for(var i = 0; i < this.represent.length; i++){
        if(!this.represent[i].equals(another.represent[i])){
            return false;
        }
    }
    return true;
};

var elementController;
function SDController(objects, groups, messages){
    elementController = new ElementController(objects, groups);
}

SDController.prototype.draw = function() {
    generateLayout();
    var display = elementController.getDisplay();
    for(var i = 0; i < display.length; i++){
        // draw the element
        drawElement(display[i]);
    }
};

function unfold(group){
    elementController.unfoldUpdateStatus(group.id);
    unfoldUpdateElements(group, elementController);
}

function fold(group){
    elementController.foldUpdateStatus(group.id);
    foldUpdateElements(group, elementController);
}

function allFolded(group) {
    for(var i = 0; i < group.children.length; i++){
        var e = elementController.getElementMap().get(group.children[i]);
        if(e.isGroup() && !e.fold)
            return false;
    }
    return true;
}

function foldAll(group){
    var stack = [];
    stack.push(group);
    while(stack.length != 0){
        var tempGroup = stack[stack.length - 1];
        if(allFolded(tempGroup)){
            fold(tempGroup);
            stack.splice(stack.length - 1, 1);
        }
        else{
            for(var i  = 0; i < tempGroup.children.length; i++){
                var t = elementController.getElementMap().get(tempGroup.children[i]);
                if(t.isGroup()){
                    if(allFolded(t)){
                        fold(t);
                    }
                    else{
                        stack.push(t);
                    }
                }
            }
        }
    }
}


/********************************************************************************************************************
Rest part is the 'render' part, which contains functions to draw / modify elements on the SVG.
*********************************************************************************************************************/
var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_HEIGHT = 4;

var PADDING_GROUP = 10;

var ELEMENT_PADDING = ELEMENT_HEIGHT;

function drawElement(element){
    var tempG = d3.select(".objects-layout").append("g");
    //TODO Draw a lifeline

    // Draw rectangle
    var rect = tempG.append("rect")
                    .attr({x: 0, y: 0, width: element.width, height: element.height})
                    .style("stroke", "black");
    if(element.isGroup()){
        rect.style("fill", "yellow");
    }
    else{
        rect.style("fill", "white");
    }

    // Write names
    tempG.append("text")
         .text(function(d){ return element.displayName; })
         .attr("transform", "translate(" + element.width / 2 + "," + (element.height / 2 + ELEMENT_CH_HEIGHT) + ")")
         .attr("text-anchor", "middle");

    // Move object to where it should be
    tempG.attr("class", "element")
         .datum(element)
         .attr("transform", "translate(" + element.x + ", " + element.y + ")");

     // add mouse events to groups
     if(element.isGroup()){
         tempG.on("click", function(thisGroup){
             if(thisGroup.fold){
                 unfold(thisGroup);
             }
             else{
                 foldAll(thisGroup);
             }
         });
    }

    return tempG;
}

function generateLayout() {
    // Add layouts into svg
    d3.select("svg")
        .append("g")
        .attr("class", "baseline-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "loop-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "messages-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "objects-layout")
        .attr("transform", "translate(0, 0)");
}

function unfoldUpdateElements(group, elementController){
    d3.selectAll(".element")
      .each(function(element){
          if(element.isGroup()){
              d3.select(this).select("rect")
                .transition()
                .attr({width: element.width, height:element.height});
              if(element == group){
                  d3.select(this)
                    .transition()
                    .style("fill-opacity", "0")
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                /*
                  d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")")
                    .style("opacity", 0);
                */
              }
              else{
                  d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                /*
                  d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                */
              }
          }
          else{
              d3.select(this)
                .transition()
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");
            /*
              d3.select("#baseLine" + element.id)
                .transition()
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");
            */
          }
    });

    elementController.getDisplay().forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });

    var elementMap = elementController.getElementMap();
    for(var i = 0; i < group.children.length; i++){
        var elementId = group.children[i];
        var thisElement = elementMap.get(elementId);
        var temp = drawElement(thisElement);
        temp.attr("transform", "translate(" + group.x + ", " + (group.y + PADDING_GROUP) + ")");
        temp.transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
        /*
        d3.select("#baseLine" + elementId)
            .transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
        */
    }
}

function foldUpdateElements(group, elementController) {
    d3.selectAll(".element")
        .each(function(element){
            console.log(group);
            console.log(element.id);
            if(group.children.indexOf(element.id) != -1){
                //d3.select("#baseLine" + element.id).remove();
                d3.select(this).remove();
            }
            else if(element.isGroup()){
                d3.select(this).select("rect")
                    .transition()
                    .attr({width: element.width, height:element.height});

                ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);

                if(element == group){
                    d3.select(this)
                        .transition()
                        .style("fill-opacity", "1")
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    /*
                    d3.select("#baseLine" + element.id)
                        .transition()
                        .style("opacity", 1)
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    */
                }
                else{
                    d3.select(this)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    /*
                    d3.select("#baseLine" + element.id)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    */
                }
            }
            else{
                d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                /*
                d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                */
            }
        });

    ELEMENT_PADDING = ELEMENT_HEIGHT;
    elementController.getDisplay().forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });
}

exports.SDController = SDController;

Object.defineProperty(exports, '__esModule', { value: true });

})));
