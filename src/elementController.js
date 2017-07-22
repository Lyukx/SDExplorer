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

export default function ElementController(objects, groups){
    total = initElement(objects, groups);;
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

    this.total = total;
    this.display = display;
}

ElementController.prototype.unfoldUpdateStatus = function(groupId){
//function unfoldUpdateStatus(groupId) {
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
}

ElementController.prototype.foldUpdateStatus = function(groupId){
//function foldUpdateStatus(groupId) {
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
