(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.sd = {})));
}(this, (function (exports) { 'use strict';

var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 10;
var ELEMENT_CH_HEIGHT = 4;
var PADDING = 20;
var PADDING_GROUP = 10;

function Element(rawElement) {
    this.id = rawElement.id;
    this.name = rawElement.name;
    this.parent = -1;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.height = ELEMENT_HEIGHT;
    this.width = this.name.length * ELEMENT_CH_WIDTH + PADDING * 2;
    this.fold = true;
}

Element.prototype.isGroup = function () {
    if(this.children.length == 0)
        return false;
    else
        return true;
};

var total = [];
var display = [];

function initElement(objects, groups) {
    var total = new Map();
    objects.forEach(function(object) {
        object.name = object.name + ":" + object.type;
        var e = new Element(object);
        total.set(e.id, e);
    });

    groups.forEach(function(group) {
        var e = new Element(group);
        e.children = group.objs;
        total.set(e.id, e);
    });

    groups.forEach(function(group) {
        objects = group.objs;
        for(var i = 0; i < objects.length; i++) {
            var thisElement = total.get(objects[i]);
            thisElement.parent = group.id;
        }
    });

    return total;
}

function DisplayElements(objects, groups){
    total = initElement(objects, groups);
    //var display = [];
    total.forEach(function(element, key, map){
        if(element.parent == -1)
            display.push(element);
    });

    display.sort(function(a, b){
        var ida = a.id;
        var idb = b.id;
        if(a.isGroup()) ida = a.children[0];
        if(b.isGroup()) idb = b.children[0];
        return ida - idb;
    });

    var dist = PADDING;
    for(var i = 0; i < display.length; i++){
        display[i].x = dist;
        dist += (display[i].width + PADDING);
    }

    //display = display;
    this.total = total;
    this.display = display;
}

function drawElement(element) {
    var tempG = d3.select("svg").append("g");

    // Draw rectangles
    var rect = tempG.append("rect")
                .attr({x: 0, y: 0, width: element.width, height: element.height})
                .style("stroke", "black");
    if(element.isGroup())
        rect.style("fill", "yellow");
    else
        rect.style("fill", "white");

    // Write names of objects
    tempG.append("text")
        .text(function(d){ return element.name; })
        .attr("transform", "translate(" + element.width / 2 + "," + (element.height / 2 + ELEMENT_CH_HEIGHT) + ")")
        .attr("text-anchor", "middle");

    //TODO: Draw base line of the objects

    // Move the object to where it should be
    tempG.attr("class", "element-rectangle")
        .datum(element)
        .attr("transform", "translate(" + element.x + ", " + element.y + ")");

    return tempG;
}

DisplayElements.prototype.drawAll = function() {
    display.forEach(function(element){
        // Draw element
        var tempG = drawElement(element);

        // If element is group, add mouse event to it
        if(element.isGroup()){
            tempG.on("click", function(thisGroup){
                // unfold the group
                if(thisGroup.fold){
                    unfold(thisGroup.id);

                    d3.selectAll(".element-rectangle")
                        .each(function(element){
                            if(thisGroup == element){
                                d3.select(this).transition()
                                    .attr({width: thisGroup.width, height:thisGroup.height})
                                    .attr("transform", "translate(" + thisGroup.x + ", " + thisGroup.y + ")");
                            }
                        });

                    thisGroup.children.forEach(function(elementId){
                        var temp = drawElement(total.get(elementId));
                        //temp.attr("transform", "translate(" + thisGroup.x + ", " + thisGroup.y + ")");
                        //temp.transition()
                        //    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    });
                }
            });
        }
    });
};

function unfold(groupId) {
    var thisGroup = total.get(groupId);
    if(!thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var dist = PADDING_GROUP;
    var index = display.indexOf(thisGroup) + 1;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = total.get(elementIds[i]);
        thisElement.x = dist + thisGroup.x;
        display.splice(index, 0, thisElement);
        dist += (thisElement.width + PADDING);
    }

    thisGroup.width = (dist - PADDING + PADDING_GROUP);
    thisGroup.y -= PADDING_GROUP;
    thisGroup.height += (2 * PADDING_GROUP);
    thisGroup.fold = false;
}

exports.DisplayElements = DisplayElements;

Object.defineProperty(exports, '__esModule', { value: true });

})));
