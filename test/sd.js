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
        this.displayName += (":" + rawElement.type);
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

var elementMap$1 = []; // [id => element]
var display$1 = [];
var displaySet$1;

function initElements(objects, groups) {
    elementMap$1 = new Map();
    // Add objects
    objects.forEach(function(object) {
        var e = new Element(object);
        elementMap$1.set(e.id, e);
    });

    // Add group information
    groups.forEach(function(group) {
        var e = new Element(group);
        e.children = group.objs;
        elementMap$1.set(e.id, e);

        objects = group.objs;
        for(var i = 0; i < objects.length; i++) {
            var thisElement = elementMap$1.get(objects[i]);
            thisElement.parent = group.id;
        }
    });
}

function ElementController(objects, groups){
    initElements(objects, groups);

    elementMap$1.forEach(function(element, key, map){
        if(element.parent == -1)
            display$1.push(element);
    });

    // Sort by such a rule: put a group at where 1st object in it should be
    display$1.sort(function(a, b){
        var ida = a.id;
        var idb = b.id;
        if(a.isGroup()) ida = a.children[0];
        if(b.isGroup()) idb = b.children[0];
        return ida - idb;
    });

    // Decide the position of elements
    var dist = PADDING$1;
    for(var i = 0; i < display$1.length; i++){
        display$1[i].x = dist;
        dist += (display$1[i].width + PADDING$1);
    }

    updateDisplaySet();

    this.display = display$1;
    this.elementMap = elementMap$1;
    this.displaySet = displaySet$1;
}

ElementController.prototype.getGroupFoldInfo = function(){
    var groupFoldInfo = new Set();
    for(let element of display$1){
        if(element.isGroup() && !element.fold){
            groupFoldInfo.add(element.id);
        }
    }

    return groupFoldInfo;
};

ElementController.prototype.unfoldUpdateStatus = function(groupId){
    var thisGroup = elementMap$1.get(groupId);
    if(!thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var dist = PADDING_GROUP$1;
    var index = display$1.indexOf(thisGroup) + 1;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = elementMap$1.get(elementIds[i]);
        thisElement.x = dist + thisGroup.x;
        display$1.splice(index, 0, thisElement);
        index++;
        dist += (thisElement.width + PADDING$1);
    }

    var diff = dist - PADDING$1 + PADDING_GROUP$1 - thisGroup.width;
    while(index < display$1.length){
        display$1[index].x += diff;
        index++;
    }

    thisGroup.width += diff;
    thisGroup.y -= PADDING_GROUP$1;
    thisGroup.height += (2 * PADDING_GROUP$1);
    thisGroup.fold = false;

    // If there are parent groups
    var tempGroup = thisGroup;
    while(tempGroup.parent != -1){
        tempGroup = elementMap$1.get(tempGroup.parent);
        tempGroup.width += diff;
        tempGroup.height += (2 * PADDING_GROUP$1);
        tempGroup.y -= PADDING_GROUP$1;
    }

    updateDisplaySet();
};

ElementController.prototype.foldUpdateStatus = function(groupId){
    var thisGroup = elementMap$1.get(groupId);
    if(thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var index = 0;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = elementMap$1.get(elementIds[i]);
        index = display$1.indexOf(thisElement);
        display$1.splice(index, 1); // Remove elements in group from display
    }

    var diff = thisGroup.width - (thisGroup.displayName.length * ELEMENT_CH_WIDTH$1 + PADDING$1 * 2);
    while(index < display$1.length){
        display$1[index].x -= diff;
        index++;
    }

    thisGroup.width -= diff;
    thisGroup.y += PADDING_GROUP$1;
    thisGroup.height -= (2 * PADDING_GROUP$1);
    thisGroup.fold = true;

    // If there are parent groups
    var tempGroup = thisGroup;
    while(tempGroup.parent != -1){
        tempGroup = elementMap$1.get(tempGroup.parent);
        tempGroup.width -= diff;
        tempGroup.height -= (2 * PADDING_GROUP$1);
        tempGroup.y += PADDING_GROUP$1;
    }

    updateDisplaySet();
};

function updateDisplaySet(){
    displaySet$1 = new Set();
    for(let element of display$1){
        if(!(element.isGroup() && !element.fold)){
            displaySet$1.add(element.id);
        }
    }
}

function Message(rawMessage){
    this.from = rawMessage.from;
    this.to = rawMessage.to;
    this.message = rawMessage.message;
    this.id = rawMessage.id;
    this.valid = false;
    this.scale = 1;
    this.position = 0;
    this.fromOffset = 0;
    this.toOffset = 0;
}

Message.prototype.equals = function(another){
    // position doesn't need to be same
    return (this.from == another.from && this.to == another.to && this.message == another.message);
};

Message.prototype.isReturn = function(){
    return (this.to == -1 && this.message.length == 0)
};

var MSG_HEIGHT$1 = 80;
var validMessages$1; // The valid messages (those be displayed)
var originMessages; // Total messages (Saved in a map form: [id => message])
var totalMessages; // Total messages (from / to may be changed by grouping objects)

var mainThreadSet;

function MessageController(messages, mainThreads, displaySet, elementMap){
    validMessages$1 = [];
    originMessages  = new Map();
    totalMessages = [];
    for(let message of messages){
        // Filter invalid messages
        totalMessages.push(new Message(message));
        originMessages.set(message.id, {from:message.from, to:message.to});
    }

    // if the message is from/to elements in a grouped group, change the from/to attribute
    for(let message of totalMessages){
        if(message.to == -1){ // skip return message
            continue;
        }
        while(!displaySet.has(message.from)){
            var parent = elementMap.get(message.from).parent;
            if(parent == -1){
                break;
            }
            message.from = parent;
        }
        while(!displaySet.has(message.to)){
            var parent = elementMap.get(message.to).parent;
            if(parent == -1){
                break;
            }
            message.to = parent;
        }
    }

    mainThreadSet = mainThreads;
    updateStatus();

    this.validMessages = validMessages$1;
}

MessageController.prototype.foldUpdateStatus = function(group){
    for(let message of totalMessages){
        if(message.to == -1){ // skip return message
            continue;
        }
        if(group.children.indexOf(message.from) != -1)
            message.from = group.id;
        if(group.children.indexOf(message.to) != -1)
            message.to = group.id;
    }
    updateStatus();
};

MessageController.prototype.unfoldUpdateStatus = function(display, elementMap){
    for(let message of totalMessages){
        if(message.to == -1){ // skip return message
            continue;
        }
        if(!display.has(message.from)){
            message.from = originMessages.get(message.id).from;
            while(!display.has(message.from)){
                var parent = elementMap.get(message.from).parent;
                if(parent == -1){
                    break;
                }
                message.from = parent;
            }
        }
        if(!display.has(message.to)){
            message.to = originMessages.get(message.id).to;
            while(!display.has(message.to)){
                var parent = elementMap.get(message.to).parent;
                if(parent == -1){
                    break;
                }
                message.to = parent;
            }
        }
        //console.log("" + message.from + " -> " + message.to + " : " + message.message);
    }
    return updateStatus();
};

function updateStatus() {
    // Remove invalid messages in total message
    var rawValidMessages = [];
    var validMessageSet = new Set(); // id
    for(var i = 0; i < totalMessages.length; i++){
        var thisMsg = totalMessages[i];
        if(thisMsg.isReturn()){
            if(validMessageSet.has(thisMsg.id)){
                rawValidMessages.push(thisMsg);
            }
        }
        else if(thisMsg.to != thisMsg.from && thisMsg.from != -1 && thisMsg.to != -1){
            rawValidMessages.push(thisMsg);
            validMessageSet.add(thisMsg.id);
        }
        else{
            thisMsg.valid = false;
        }
    }

    // Decide the position and scale of messages
    validMessages$1 = [];
    var enabledMessages = [];
    var activeStack = new ActiveStack();
    var messageMap = new Map(); // id => message

    var position = MSG_HEIGHT$1 / 4;

    for(var i = 0; i < rawValidMessages.length; i++){
        var thisMessage = rawValidMessages[i];
        if(!thisMessage.isReturn()){
            messageMap.set(thisMessage.id, [thisMessage, i]);
            position += MSG_HEIGHT$1 / 2;
            thisMessage.position = position;

            activeStack.push(thisMessage);
            thisMessage.fromOffset = activeStack.getOffset(thisMessage.from);
            thisMessage.toOffset = activeStack.getOffset(thisMessage.to);

            if(!thisMsg.valid){
                enabledMessages.push(thisMsg);
            }
            thisMessage.valid = true;
            validMessages$1.push(thisMessage);
        }
        else{
            var returnedMessage = messageMap.get(thisMessage.id)[0];
            var distance = i - messageMap.get(thisMessage.id)[1];
            position += MSG_HEIGHT$1 / 2;
            returnedMessage.scale = (distance + 1) / 2;

            // Here we have an assume that every time the stack pops, we get the message returned
            // It works in single-thread sequence diagram, but this return method actually doesn't work in multi-thread scenario
            activeStack.pop();
        }
    }

    // It is possible that not all messages are returned while drawing partial sequence diagrams
    var count = rawValidMessages.length;
    while(!activeStack.isEmpty()){
        var message = activeStack.pop();
        var distance = count - messageMap.get(message.id)[1];
        position += MSG_HEIGHT$1 / 2;
        message.scale = (distance + 1) / 2;
        count ++;
    }

    return enabledMessages;
}

//Decide the validations/scales/positions/stackOffsets of messages
// 2017.12.1 tend to use return message, so the call stack based method is no use
// However, this part still has its value to support the lack-return sequence diagram, so it is remained.
/*
function updateStatus(){
    var activeStack = new ActiveStack();

    var position = MSG_HEIGHT / 4;
    var feedBack = 0; // A

    var enabledMessages = []; // After unfold operation there might be newly enabled messages
    validMessages = [];

    for(var i = 0; i < totalMessages.length; i++){
        var thisMsg = totalMessages[i];
        // Invalid message
        if(thisMsg.to == thisMsg.from || thisMsg.from == -1 || thisMsg.to == -1){
            thisMsg.valid = false;
        }

        // Message from main thread
        else if(mainThreadSet.has(thisMsg.from)){
            position += (activeStack.stack.length + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // clear the call stack
            activeStack = new ActiveStack();

            // Add message into active stack
            activeStack.push(thisMsg);
            thisMsg.fromOffset = activeStack.getOffset(thisMsg.from);
            thisMsg.toOffset = activeStack.getOffset(thisMsg.to);

            //Check enabled
            if(!thisMsg.valid){
                enabledMessages.push(thisMsg);
            }
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessages.push(thisMsg);
        }

        // Message from active block
        else if(activeStack.hasActive(thisMsg.from)){
            if(!thisMsg.valid){
                enabledMessages.push(thisMsg);
            }
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessages.push(thisMsg);
            // Decide the position
            var feedBack = 0;
            // After loop the peek of the stack is the last valid message in the call chain
            while(activeStack.peek().to != thisMsg.from){
                var top = activeStack.pop();
                feedBack += 1;
            }
            position += (feedBack + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // Modify the scale of messages in the call chain
            activeStack.stack.forEach(function(msg){
                msg.scale += 1;
            });
            // Add the message into active set & stack
            activeStack.push(thisMsg);
            thisMsg.fromOffset = activeStack.getOffset(thisMsg.from);
            thisMsg.toOffset = activeStack.getOffset(thisMsg.to);
        }

        // Message come from non-active or not-main-thread objects
        else{
            thisMsg.valid = false;
        }
    }
    return enabledMessages;
}
*/
function ActiveStack(){
    this.stack = [];
    this.offset = new Map();
    for (let mainThread of mainThreadSet){
        this.offset.set(mainThread, 0);
    }
}

ActiveStack.prototype.push = function(message){
    this.stack.push(message);

    if(this.offset.has(message.to)){
        this.offset.set(message.to, this.offset.get(message.to) + 1);
    }
    else{
        this.offset.set(message.to, 0);
    }
};

ActiveStack.prototype.pop = function(){
    var message = this.stack.pop();
    var temp = this.offset.get(message.to) - 1;
    if(temp < 0){
        this.offset.delete(message.to);
    }
    else{
        this.offset.set(message.to, temp);
    }

    return message;
};

ActiveStack.prototype.peek = function(){
    return this.stack[this.stack.length - 1];
};

ActiveStack.prototype.hasActive = function(objectId){
    return this.offset.has(objectId);
};

ActiveStack.prototype.isEmpty = function(){
    return this.stack.length == 0;
};

ActiveStack.prototype.getOffset = function(elementId){
    if(this.offset.has(elementId)){
        return this.offset.get(elementId);
    }
    else{
        return 0;
    }
};

var elementController;
var messageController;

var mainThread;

var display;
var elementMap;
var displaySet;

var validMessages;

function SDController(objects, groups, messages){
    elementController = new ElementController(objects, groups);
    elementMap = elementController.elementMap;
    display = elementController.display;
    displaySet = elementController.displaySet;

    // TODO add multi-thread
    var mainThreadSet = new Set([0]);
    var temp = elementMap.get(0);
    while(temp.parent != -1){
        mainThreadSet.add(temp.parent);
        temp = elementMap.get(temp.parent);
    }
    mainThread = [0];

    messageController = new MessageController(messages, mainThreadSet, displaySet, elementMap);
    validMessages = messageController.validMessages;

    generateLayout();
}

SDController.prototype.draw = function() {
    generateLayout();

    // draw the elements
    for(var i = 0; i < display.length; i++){
        drawElement(display[i]);
    }

    // draw the main threads
    drawMainThread();

    // draw the messages
    for(let message of validMessages){
        drawMessage(message);
    }
};

SDController.prototype.getMessages = function() {
    return validMessages;
};

SDController.prototype.getElementSet = function() {
    return displaySet;
};

SDController.prototype.getElementMap = function() {
    return elementMap;
};

function unfold(group){
    elementController.unfoldUpdateStatus(group.id);
    unfoldUpdateElements(group, elementController);

    var enabled = messageController.unfoldUpdateStatus(displaySet, elementMap);
    updateMessages(enabled);

    updateTopY();
}

function fold(group){
    elementController.foldUpdateStatus(group.id);
    foldUpdateElements(group, elementController);

    messageController.unfoldUpdateStatus(displaySet, elementMap);
    updateMessages([]); // When fold objects, no new message will appear

    updateTopY();
}

function allFolded(group) {
    for(var i = 0; i < group.children.length; i++){
        var e = elementMap.get(group.children[i]);
        if(e.isGroup() && !e.fold)
            return false;
    }
    return true;
}

// Use a DFS to visit the grouping tree, and fold the group as well as its unfolded children groups
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
                var t = elementMap.get(tempGroup.children[i]);
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

/****************************************************************************
This part is "Advanced ussage" of this module.
They are used in SDViewer module to controll the display
****************************************************************************/
// ---------- Sized window mode --------
// Only part of elements / messages will be drawn in such a window view
var diagramSizeX;
var diagramSizeY;
var diagramStartEle;
var diagramStartMsg;
var sizeSetted = false; // this is the switch of sized window mode

SDController.prototype.setDiagramSize = function(x, y) {
    diagramSizeX = x;
    diagramSizeY = y;
    sizeSetted = true;
    this.setDiagramDisplayHead(0, 0);
};

SDController.prototype.setDiagramDisplayHead = function(x, y) {
    diagramStartEle = x;
    diagramStartMsg = y;
};

SDController.prototype.getMiddleElementIndex = function() {
    return diagramStartEle + (diagramSizeX / 2);
};

SDController.prototype.getMiddleElementX = function() {
    var index = this.getMiddleElementIndex();
    if(index < display.length){
        return display[index].x;
    }
    else{
        // Returns -1 means rightest part of the sequence diagram is displayed
        return -1;
    }
};

SDController.prototype.getHeadElementX = function() {
    return display[diagramStartEle].x;
};

SDController.prototype.getMiddleMessageIndex = function() {
    return diagramStartMsg + (diagramSizeY / 2);
};

SDController.prototype.getMiddleMessageY = function() {
    var index = this.getMiddleMessageIndex();
    if (index < validMessages.length){
        return validMessages[index].position;
    }
    else {
        // Return -1 means the most bottom part of the sequence diagram is displayed
        return -1;
    }
};

SDController.prototype.getHeadMessageY = function() {
    return validMessages[diagramStartMsg].position;
};

SDController.prototype.getIndexByMessageId = function(id) {
    var elementIndex = -1;
    var messageIndex = -1;
    var elementPosition = -1;
    var messagePosition = -1;
    for(var i = 0; i < validMessages.length; i++){
        if(validMessages[i].id == id){
            messageIndex = i;
            messagePosition = validMessages[i].position;
            break;
        }
    }
    if(messageIndex != -1){
        for(var j = 0; j < display.length; j++){
            if(display[j].id == validMessages[messageIndex].from){
                elementIndex = j;
                elementPosition = display[j].x;
                break;
            }
        }
    }

    return [elementIndex, messageIndex, elementPosition, messagePosition - 60];
};

function updateTopY() {
    var top = 0;
    for(var i = diagramStartEle; i < diagramStartEle + diagramSizeX; i++){
        if(i >= display.length)
            break;
        top = Math.min(display[i].y, top);
    }

    var oldVBY = parseInt(d3.select(".objects-layout").attr("transform").split(/,|\)/)[1]);
    if(SDController.prototype.top == undefined){
        d3.select(".objects-layout")
            .attr("transform", "translate(0," + (oldVBY - top)  + ")");
        SDController.prototype.top = top;
    }
    else if(SDController.prototype.top != top){
        d3.select(".objects-layout")
            .attr("transform", "translate(0," + (oldVBY + SDController.prototype.top - top)  + ")");
        SDController.prototype.top = top;
    }
}

SDController.prototype.drawWindow = function() {
    // draw the elements
    for(var i = diagramStartEle; i < diagramStartEle + diagramSizeX; i++){
        if(i >= display.length){
            break;
        }
        drawElement(display[i]);
    }

    updateTopY();

    // draw the main threads
    drawMainThread();

    // draw the messages
    for(var i = diagramStartMsg; i < diagramSizeY; i++){
        if(i >= validMessages.length){
            break;
        }
        drawMessage(validMessages[i]);
    }
};

SDController.prototype.clearAll = function() {
    d3.select(".messages-layout").remove();
    d3.select(".objects-layout").remove();
    d3.select(".loop-layout").remove();
    d3.select(".loop-layout").remove();
    d3.select(".mainthread-layout").remove();
    d3.select(".baseline-layout").remove();

    generateLayout();
};

SDController.prototype.getFoldInfo = function() {
    // Return a set of unfold groups
    return elementController.getGroupFoldInfo();
};

SDController.prototype.updateWithoutAnimation = function(unfoldSet) {
    for(let element of display){
        if(unfoldSet.has(element.id)){
            elementController.unfoldUpdateStatus(group.id);
            unfoldUpdateElementsWithoutAnimation(group, elementController);

            var enabled = messageController.unfoldUpdateStatus(displaySet, elementMap);
            updateMessagesWithoutAnimation(enabled);
        }
    }
};

/********************************************************************************************************************
Rest part is the 'render' part, which contains functions to draw / modify elements on the SVG.
*********************************************************************************************************************/
var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_HEIGHT = 4;

var PADDING = 20;
var PADDING_GROUP = 10;

var ELEMENT_PADDING = ELEMENT_HEIGHT;

var MSG_ACTIVE_WIDTH = 10;
var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 8;

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
        .attr("class", "mainthread-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "messages-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "objects-layout")
        .attr("transform", "translate(0, 0)");
}

function drawElement(element){
    var tempG = d3.select(".objects-layout").append("g");
    // Draw a lifeline
    var x = element.width / 2;
    var msgNum = sizeSetted && diagramStartMsg + diagramSizeY < validMessages.length ? diagramSizeY : validMessages.length;
    var y1 = 0;
    var y2 = msgNum * MSG_HEIGHT + ELEMENT_HEIGHT + MSG_HEIGHT / 2;
    d3.select(".baseline-layout").append("line")
        .attr("class", "baseLine")
        .attr("x1", x)
        .attr("y1", y1)
        .attr("x2", x)
        .attr("y2", y2)
        .style("stroke", "black")
        .style("stroke-dasharray", "2,2,2")
        .attr("id", "baseLine" + element.id)
        .attr("transform", "translate(" + element.x + ", " + element.y + ")");


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

                  d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")")
                    .style("opacity", 0);
              }
              else{
                  d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");

                  d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
              }
          }
          else{
              d3.select(this)
                .transition()
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");

              d3.select("#baseLine" + element.id)
                .transition()
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");
          }
    });

    display.forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });

    for(var i = 0; i < group.children.length; i++){
        var elementId = group.children[i];
        var thisElement = elementMap.get(elementId);
        var temp = drawElement(thisElement);
        temp.attr("transform", "translate(" + group.x + ", " + (group.y + PADDING_GROUP) + ")");
        temp.transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");

        d3.select("#baseLine" + elementId)
            .transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
    }
}

function foldUpdateElements(group, elementController) {
    d3.selectAll(".element")
        .each(function(element){
            if(group.children.indexOf(element.id) != -1){
                d3.select("#baseLine" + element.id).remove();
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

                    d3.select("#baseLine" + element.id)
                        .transition()
                        .style("opacity", 1)
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                }
                else{
                    d3.select(this)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");

                    d3.select("#baseLine" + element.id)
                        .transition()
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                }
            }
            else{
                d3.select(this)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");

                d3.select("#baseLine" + element.id)
                    .transition()
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
            }
        });

    ELEMENT_PADDING = ELEMENT_HEIGHT;
    display.forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });
}

function unfoldUpdateElementsWithoutAnimation(group, elementController){
    d3.selectAll(".element")
      .each(function(element){
          if(element.isGroup()){
              d3.select(this).select("rect")
                .attr({width: element.width, height:element.height});
              if(element == group){
                  d3.select(this)
                    .style("fill-opacity", "0")
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");

                  d3.select("#baseLine" + element.id)
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")")
                    .style("opacity", 0);
              }
              else{
                  d3.select(this)
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");

                  d3.select("#baseLine" + element.id)
                    .attr("transform", "translate(" + element.x + ", " + element.y + ")");
              }
          }
          else{
              d3.select(this)
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");

              d3.select("#baseLine" + element.id)
                .attr("transform", "translate(" + element.x + ", " + element.y + ")");
          }
    });

    display.forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });

    for(var i = 0; i < group.children.length; i++){
        var elementId = group.children[i];
        var thisElement = elementMap.get(elementId);
        var temp = drawElement(thisElement);
        temp.attr("transform", "translate(" + group.x + ", " + (group.y + PADDING_GROUP) + ")");
        temp.attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");

        d3.select("#baseLine" + elementId)
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
    }
}

function drawMessage(message){
    var from = elementMap.get(message.from);
    var to = elementMap.get(message.to);
    // left active bar
    var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.fromOffset * MSG_ACTIVE_WIDTH;
    var y1 = message.position + MSG_PADDING;
    var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

    // right active bar
    var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.toOffset * MSG_ACTIVE_WIDTH;
    var y2 = y1 + MSG_PADDING;
    var h2 = h1 - 2 * MSG_PADDING;

    // in sized-window mode, avoid drawing too long lines could improve performance
    if(sizeSetted){
        var xMin = diagramStartEle > 0 ? display[diagramStartEle - 1].x : display[0].x;
        var last = diagramStartEle + diagramSizeX;
        if(last >= display.length)
            last = display.length - 1;
        var xMax = display[last].x;
        if(x1 < xMin)
            x1 = xMin;
        if(x2 > xMax)
            x2 = xMax;
    }

    var leftToRight = (elementMap.get(message.from).x < elementMap.get(message.to).x);

    var tempG = d3.select(".messages-layout").append("g");

    // Write messages
    var text = tempG.append("text")
                    .attr("class", "message-text")
                    .text(function(d){ return message.message; });
    if(leftToRight){
        text.attr("transform", "translate(" + (x1 + PADDING) + "," + y1 + ")");
    }
    else{
        text.attr("transform", "translate(" + (x1 - MSG_ACTIVE_WIDTH) + "," + y1 + ")")
            .attr("text-anchor", "end");
    }

    // Draw call line
    tempG.append("line")
			.attr("class", "callLine")
            .style("stroke", "black")
            .attr("x1", leftToRight ? x1 + MSG_ACTIVE_WIDTH : x1)
            .attr("y1", y2)
            .attr("x2", leftToRight ? x2 : x2 + MSG_ACTIVE_WIDTH)
            .attr("y2", y2)
            .attr("marker-end", "url(#end)");

    // Draw return line
    tempG.append("line")
			.attr("class", "callBackLine")
            .style("stroke", "black")
            .style("stroke-dasharray", "5, 5, 5")
            .attr("x1", leftToRight ? x2 : x2 + MSG_ACTIVE_WIDTH)
            .attr("y1", y2 + h2)
            .attr("x2", leftToRight ? x1 + MSG_ACTIVE_WIDTH : x1)
            .attr("y2", y2 + h2)
            .attr("marker-end", "url(#end)");

    // Draw right active block
    tempG.append("rect")
        	.attr("class", "rightActiveBlock")
        	.attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h2})
        	.attr("transform", "translate(" + x2 + "," + y2 + ")")
			.style("stroke", "black")
			.style("fill", "#CCC");

    tempG.attr("class", "message")
        .datum(message);
}

function updateMessages(enabled){
    // If there are newly appear messages, draw them
    for(let message of enabled){
        if(message.valid)
            drawMessage(message);
    }

    d3.selectAll(".message")
        .each(function(message){
            if(!message.valid){
                d3.select(this).remove();
                return;
            }
            var from = elementMap.get(message.from);
            var to = elementMap.get(message.to);

            // left active bar
            var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.fromOffset * MSG_ACTIVE_WIDTH;
            var y1 = message.position + MSG_PADDING;
            var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

            // right active bar
            var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.toOffset * MSG_ACTIVE_WIDTH;
            var y2 = y1 + MSG_PADDING;
            var h2 = h1 - 2 * MSG_PADDING;

            var leftToRight = (elementMap.get(message.from).x < elementMap.get(message.to).x);

            // Update messages
            if(leftToRight){
                d3.select(this).select(".message-text")
                    .transition()
                    .attr("transform", "translate(" + (x1 + PADDING) + "," + y1 + ")");
            }
            else{
                d3.select(this).select(".message-text")
                    .transition()
                    .attr("transform", "translate(" + (x1 - MSG_ACTIVE_WIDTH) + "," + y1 + ")");
            }

            d3.select(this).select(".callLine")
                .transition()
                .attr("x1", leftToRight ? x1 + MSG_ACTIVE_WIDTH : x1)
                .attr("y1", y2)
                .attr("x2", leftToRight ? x2 : x2 + MSG_ACTIVE_WIDTH)
                .attr("y2", y2);

            d3.select(this).select(".callBackLine")
                .transition()
                .attr("x1", leftToRight ? x2 : x2 + MSG_ACTIVE_WIDTH)
                .attr("y1", y2 + h2)
                .attr("x2", leftToRight ? x1 + MSG_ACTIVE_WIDTH : x1)
                .attr("y2", y2 + h2);

            d3.select(this).select(".rightActiveBlock")
                .transition()
                .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h2})
                .attr("transform", "translate(" + x2 + "," + y2 + ")");

            d3.select(this).select(".message-click-active-block")
                .transition()
                .attr({x: -PADDING, y: -PADDING, width: 2 * PADDING + Math.abs(x2 - x1), height: 2 * PADDING + h2})
                .attr("transform", "translate(" + Math.min(x1,x2) + "," + y2 + ")");
        });

    var msgNum = sizeSetted && diagramStartMsg + diagramSizeY < validMessages.length ? diagramSizeY : validMessages.length;
    var y2 = msgNum * MSG_HEIGHT + ELEMENT_HEIGHT + MSG_HEIGHT / 2;
    d3.selectAll(".baseLine")
        .attr("y2", y2);

    updateMainThread();
}

function updateMessagesWithoutAnimation(enabled){
    // If there are newly appear messages, draw them
    for(let message of enabled){
        if(message.valid)
            drawMessage(message);
    }

    d3.selectAll(".message")
        .each(function(message){
            if(!message.valid){
                d3.select(this).remove();
                return;
            }
            var from = elementMap.get(message.from);
            var to = elementMap.get(message.to);

            // left active bar
            var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.fromOffset * MSG_ACTIVE_WIDTH;
            var y1 = message.position + MSG_PADDING;
            var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

            // right active bar
            var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.toOffset * MSG_ACTIVE_WIDTH;
            var y2 = y1 + MSG_PADDING;
            var h2 = h1 - 2 * MSG_PADDING;

            var leftToRight = (elementMap.get(message.from).x < elementMap.get(message.to).x);

            // Update messages
            if(leftToRight){
                d3.select(this).select(".message-text")
                    .attr("transform", "translate(" + (x1 + PADDING) + "," + y1 + ")");
            }
            else{
                d3.select(this).select(".message-text")
                    .attr("transform", "translate(" + (x1 - MSG_ACTIVE_WIDTH) + "," + y1 + ")");
            }

            d3.select(this).select(".callLine")
                .attr("x1", leftToRight ? x1 + MSG_ACTIVE_WIDTH : x1)
                .attr("y1", y2)
                .attr("x2", leftToRight ? x2 : x2 + MSG_ACTIVE_WIDTH)
                .attr("y2", y2);

            d3.select(this).select(".callBackLine")
                .attr("x1", leftToRight ? x2 : x2 + MSG_ACTIVE_WIDTH)
                .attr("y1", y2 + h2)
                .attr("x2", leftToRight ? x1 + MSG_ACTIVE_WIDTH : x1)
                .attr("y2", y2 + h2);

            d3.select(this).select(".rightActiveBlock")
                .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h2})
                .attr("transform", "translate(" + x2 + "," + y2 + ")");

            d3.select(this).select(".message-click-active-block")
                .attr({x: -PADDING, y: -PADDING, width: 2 * PADDING + Math.abs(x2 - x1), height: 2 * PADDING + h2})
                .attr("transform", "translate(" + Math.min(x1,x2) + "," + y2 + ")");
        });
    var msgNum = sizeSetted && diagramStartMsg + diagramSizeY < validMessages.length ? diagramSizeY : validMessages.length;
    var y2 = msgNum * MSG_HEIGHT + ELEMENT_HEIGHT + MSG_HEIGHT;
    d3.selectAll(".baseLine")
        .attr("y2", y2);

    updateMainThread();
}

function drawMainThread() {
    for(let id of mainThread){
        var mainThreadObj = elementMap.get(id);
        while(!displaySet.has(mainThreadObj.id) && mainThreadObj.parent != -1){
            mainThreadObj = elementMap.get(mainThreadObj.parent);
        }
        var x = mainThreadObj.x + mainThreadObj.width / 2 - MSG_ACTIVE_WIDTH / 2;
        var y = MSG_HEIGHT * 0.75;
        var validNum = validMessages.length;
        var h = validNum * MSG_HEIGHT;
        d3.select(".mainthread-layout").append("rect")
                .attr("class", "mainThreadActiveBar")
                .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h})
                .attr("transform", "translate(" + x + "," + y + ")")
                .style("stroke", "black")
                .style("fill", "#CCC");
    }
}

function updateMainThread(){
    d3.selectAll(".mainThreadActiveBar").remove();
    drawMainThread();
}

// This is a module designed for displaying huge sequence diagrams
var svg;
var sdController;
var viewBoxX;
var viewBoxY;

var diagramSizeX$1 = 252;
var diagramSizeY$1 = 360;

var headX = 0;
var headY = 0;

var width;
var height;
var curPos_x;
var curPos_y;
var mousePos_x;
var mousePos_y;
var isMouseDown;
var oldScale;

var displaySet$2;
var elementMap$2;

function SDViewer(objects, groups, messages) {
    setSVG();
    sdController = new SDController(objects, groups, messages);

    sdController.setDiagramSize(diagramSizeX$1, diagramSizeY$1);
    sdController.setDiagramDisplayHead(headX, headY);
    sdController.drawWindow();
    displaySet$2 = sdController.getElementSet();
    elementMap$2 = sdController.getElementMap();
}

SDViewer.prototype.isMessageDisplayed = function(message){
    // find the from/to relationship
    while(!displaySet$2.has(message.from)){
        var parent = elementMap$2.get(message.from).parent;
        if(parent == -1){
            break;
        }
        message.from = parent;
    }
    while(!displaySet$2.has(message.to)){
        var parent = elementMap$2.get(message.to).parent;
        if(parent == -1){
            break;
        }
        message.to = parent;
    }

    return !(message.from == message.to || message.from == -1 || message.to == -1);
};

SDViewer.prototype.locate = function(messageId){
    var param = sdController.getIndexByMessageId(messageId);
    if(param[0] != -1 && param[1] != -1){
        moveViewBox(param[2], param[3]);
        onDiagramMoved();
        return true;
    }
    else{
        return false;
    }
};

SDViewer.prototype.getMessages = function() {
    return sdController.getMessages();
};

SDViewer.prototype.getElementSet= function() {
    return sdController.getElementSet();
};

SDViewer.prototype.getElementMap = function() {
    return sdController.getElementMap();
};

function onDiagramMoved() {
    if(sdController.getMiddleElementX() != -1){
        if(viewBoxX >= sdController.getMiddleElementX()){
            updateSD(sdController.getMiddleElementIndex(), headY);
        }
    }
    if(headX > 0 && viewBoxX <= sdController.getHeadElementX()){
        var temp = headX - (diagramSizeX$1 / 2);
        if(temp < 0)
            temp = 0;
        updateSD(temp, headY);
    }
    if(sdController.getMiddleMessageY() != -1){
        if(viewBoxY >= sdController.getMiddleMessageY()){
            updateSD(headX, sdController.getMiddleMessageIndex());
        }
    }
    if(headY > 0 && viewBoxY <= sdController.getHeadMessageY()){
        var temp = headY - (diagramSizeY$1 / 2);
        if(temp < 0)
            temp = 0;
        updateSD(headX, temp);
    }

    keepElementTop();
}

function moveViewBox(x, y) {
    viewBoxX = x;
    viewBoxY = y;
    svg.attr("viewBox", viewBoxX + " " + viewBoxY + " " + width / oldScale + " " + height / oldScale);
}

function updateSD(x, y) {
    sdController.clearAll();
    headX = x;
    headY = y;
    sdController.setDiagramDisplayHead(x, y);
    sdController.drawWindow();
}

function keepElementTop() {
    d3.select(".objects-layout")
        .attr("transform", "translate(0," + (viewBoxY - sdController.top) + ")");
}

function setSVG(){
    // Set svg zoomable and draggable
    width = window.innerWidth;
    height = window.innerHeight - 100;
    curPos_x, curPos_y, mousePos_x, mousePos_y;
    isMouseDown, oldScale = 1;
    viewBoxX = - 10;
    viewBoxY = - 10;
    // Clear drawArea
    d3.select("svg").remove();

    svg = d3.select("#drawArea")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .call(d3.behavior.zoom()
                	.scaleExtent([0.2, 10])
                	.on("zoom", function () {
    	                if (oldScale !== d3.event.scale) {
    	                    var scale = oldScale / d3.event.scale;
    	                    oldScale = d3.event.scale;
    	                    viewBoxX = curPos_x - scale * (curPos_x - viewBoxX);
    	                    viewBoxY = Math.max(curPos_y - scale * (curPos_y - viewBoxY), 2 * sdController.top);
    	                    svg.attr("viewBox", viewBoxX + " " + viewBoxY + " " + width / oldScale + " " + height / oldScale);

                            onDiagramMoved();
                        }
    	            }));
    svg.on("mousedown", function () {
        isMouseDown = true;
        mousePos_x = d3.mouse(this)[0];
        mousePos_y = d3.mouse(this)[1];
    });

    svg.on("mouseup", function () {
        isMouseDown = false;
        viewBoxX = viewBoxX - d3.mouse(this)[0] + mousePos_x;
        viewBoxY = Math.max(viewBoxY - d3.mouse(this)[1] + mousePos_y, 2 * sdController.top);
        svg.attr("viewBox", viewBoxX + " " + viewBoxY + " " + width / oldScale + " " + height / oldScale);
        onDiagramMoved();
    });

    svg.on("mousemove", function () {
        curPos_x = d3.mouse(this)[0];
        curPos_y = d3.mouse(this)[1];
        if (isMouseDown) {
            viewBoxX = viewBoxX - d3.mouse(this)[0] + mousePos_x;
            viewBoxY = Math.max(viewBoxY - d3.mouse(this)[1] + mousePos_y, 2 * sdController.top);
            svg.attr("viewBox", viewBoxX + " " + viewBoxY + " " + width / oldScale + " " + height / oldScale);
            onDiagramMoved();
        }
    });

    // Arrow style
    svg.append("svg:defs").selectAll("marker")
        .data(["end"])
        .enter().append("svg:marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
}

exports.SDController = SDController;
exports.SDViewer = SDViewer;

Object.defineProperty(exports, '__esModule', { value: true });

})));
