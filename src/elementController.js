import {Element} from "./element";
var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 10;
var ELEMENT_CH_HEIGHT = 4;
var PADDING = 20;
var PADDING_GROUP = 10;

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

export default function DisplayElements(objects, groups){
    total = initElement(objects, groups);;
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

function allFolded(group) {
    for(var i = 0; i < group.children.length; i++){
        var e = total.get(group.children[i]);
        if(e.isGroup() && !e.fold)
            return false;
    }
    return true;
}

function drawElement(element) {
    var tempG = d3.select("svg").append("g");

    // Draw rectangles
    var rect = tempG.append("rect")
                .attr({x: 0, y: 0, width: element.width, height: element.height})
                .style("stroke", "black")
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

    // If element is group, add mouse event to it
    if(element.isGroup()){
        tempG.on("click", function(thisGroup){
            // unfold the group
            if(thisGroup.fold){
                unfold(thisGroup);
            }
            // fold the group
            else{
                // If there are unfold groups in the group, fold them
                var stack = [];
                stack.push(thisGroup);
                while(stack.length != 0){
                    var tempGroup = stack[stack.length - 1];
                    if(allFolded(tempGroup)){
                        fold(tempGroup);
                        stack.splice(stack.length - 1, 1);
                    }
                    else{
                        for(var i = 0; i < tempGroup.children.length; i++){
                            var t = total.get(tempGroup.children[i]);
                            if(t.isGroup()){
                                if(allFolded(t)){
                                    fold(t);
                                }
                                else {
                                    stack.push(t);
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    return tempG;
}

DisplayElements.prototype.drawAll = function() {
    display.forEach(function(element){
        // Draw element
        drawElement(element);
    });
};

function unfold(group){
    unfoldUpdateStatus(group.id);
    unfoldUpdateSVG(group);
}

function fold(group){
    foldUpdateStatus(group.id);
    foldUpdateSVG(group);
}

function unfoldUpdateStatus(groupId) {
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
        index++;
        dist += (thisElement.width + PADDING);
    }

    var diff = dist - PADDING + PADDING_GROUP - thisGroup.width;
    while(index < display.length){
        display[index].x += diff;
        index++;
    }

    thisGroup.width += diff;
    thisGroup.y -= PADDING_GROUP;
    thisGroup.height += (2 * PADDING_GROUP);
    thisGroup.fold = false;

    // If there are parent groups
    var tempGroup = thisGroup;
    while(tempGroup.parent != -1){
        tempGroup = total.get(tempGroup.parent);
        tempGroup.width += diff;
        tempGroup.height += (2 * PADDING_GROUP);
        tempGroup.y -= PADDING_GROUP;
    }
};

function foldUpdateStatus(groupId) {
    var thisGroup = total.get(groupId);
    if(thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var index = 0;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = total.get(elementIds[i]);
        index = display.indexOf(thisElement);
        display.splice(index, 1); // Remove elements in group from display
    }

    var diff = thisGroup.width - (thisGroup.name.length * ELEMENT_CH_WIDTH + PADDING * 2);
    while(index < display.length){
        display[index].x -= diff;
        index++;
    }

    thisGroup.width -= diff;
    thisGroup.y += PADDING_GROUP;
    thisGroup.height -= (2 * PADDING_GROUP);
    thisGroup.fold = true;

    // If there are parent groups
    var tempGroup = thisGroup;
    while(tempGroup.parent != -1){
        tempGroup = total.get(tempGroup.parent);
        tempGroup.width -= diff;
        tempGroup.height -= (2 * PADDING_GROUP);
        tempGroup.y += PADDING_GROUP;
    }
}

function unfoldUpdateSVG(thisGroup) {
    d3.selectAll(".element-rectangle")
        .each(function(element){
            if(element.isGroup()){
                d3.select(this).select("rect")
                    .transition()
                    .attr({width: element.width, height:element.height});
                if(element == thisGroup){
                    d3.select(this)
                        .transition()
                        .style("fill-opacity", "0")
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                }
                else{
                    d3.select(this)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                }
            }
            else{
                d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
            }
        });

    for(var i = 0; i < thisGroup.children.length; i++){
        var elementId = thisGroup.children[i];
        var thisElement = total.get(elementId);
        var temp = drawElement(thisElement);
        temp.attr("transform", "translate(" + thisGroup.x + ", " + (thisGroup.y + PADDING_GROUP) + ")");
        temp.transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
    }
}

function foldUpdateSVG(thisGroup) {
    d3.selectAll(".element-rectangle")
        .each(function(element){
            if(thisGroup.children.indexOf(element.id) != -1){
                d3.select(this).remove();
            }
            else if(element.isGroup()){
                d3.select(this).select("rect")
                    .transition()
                    .attr({width: element.width, height:element.height});

                if(element == thisGroup){
                    d3.select(this)
                        .transition()
                        .style("fill-opacity", "1")
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                }
                else{
                    d3.select(this)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                }
            }
            else{
                d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
            }
        });
}
