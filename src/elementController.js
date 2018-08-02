import {Element} from "./element";
var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 8;
var ELEMENT_CH_HEIGHT = 4;
var PADDING = 20;
var PADDING_GROUP = 10;

var elementMap = []; // [id => element]
var display = [];
var displaySet = new Set();

function initElements(objects, groups) {
    elementMap = new Map();
    display = [];
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

export default function ElementController(objects, groups){
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
    var dist = PADDING;
    for(var i = 0; i < display.length; i++){
        display[i].x = dist;
        dist += (display[i].width + PADDING);
    }

    updateDisplaySet();

    this.display = display;
    this.elementMap = elementMap;
    this.displaySet = displaySet;
}

ElementController.prototype.updateAfterReOrder = function(){
  var dist = PADDING;
  for(let element of display){
    element.x = dist;
    if(element.isGroup() && !element.fold){
      dist += PADDING_GROUP;
    } else{
      dist += (element.width + PADDING);
    }
  }
}

ElementController.prototype.getGroupFoldInfo = function(){
    var groupFoldInfo = new Set();
    for(let element of display){
        if(element.isGroup() && !element.fold){
            groupFoldInfo.add(element.id);
        }
    }

    return groupFoldInfo;
}

ElementController.prototype.unfoldUpdateStatus = function(groupId){
    var thisGroup = elementMap.get(groupId);
    if(!thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var dist = PADDING_GROUP;
    var index = display.indexOf(thisGroup) + 1;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = elementMap.get(elementIds[i]);
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
        tempGroup = elementMap.get(tempGroup.parent);
        tempGroup.width += diff;
        tempGroup.height += (2 * PADDING_GROUP);
        tempGroup.y -= PADDING_GROUP;
    }

    updateDisplaySet();
}

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

    var diff = thisGroup.width - (thisGroup.displayName.length * ELEMENT_CH_WIDTH + PADDING * 2);
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
        tempGroup = elementMap.get(tempGroup.parent);
        tempGroup.width -= diff;
        tempGroup.height -= (2 * PADDING_GROUP);
        tempGroup.y += PADDING_GROUP;
    }

    updateDisplaySet();
}

function updateDisplaySet(){
    displaySet.clear();
    for(let element of display){
        if(!(element.isGroup() && !element.fold)){
            displaySet.add(element.id);
        }
    }
}
