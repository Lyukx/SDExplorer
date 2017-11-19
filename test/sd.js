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
var displaySet;

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

    updateDisplaySet();
}

ElementController.prototype.getElementMap = function(){
    return elementMap;
};

ElementController.prototype.getDisplay = function(){
    return display;
};

ElementController.prototype.getDisplaySet = function(){
    return displaySet;
};

ElementController.prototype.getGroupFoldInfo = function(){
    var groupFoldInfo = new Set();
    for(let element of display){
        if(element.isGroup() && !element.fold){
            groupFoldInfo.add(element.id);
        }
    }

    return groupFoldInfo;
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

    updateDisplaySet();
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

    updateDisplaySet();
};

function updateDisplaySet(){
    displaySet = new Set();
    for(let element of display){
        if(!(element.isGroup() && !element.fold)){
            displaySet.add(element.id);
        }
    }
}

var MSG_HEIGHT$1 = 80;
var validMessages; // The valid messages (those be displayed)
var originMessages; // Total messages (Saved in a map form: [id => message])
var totalMessages; // Total messages (from / to may be changed by grouping objects)

var mainThreadSet;

function MessageController(messages, mainThreads, displaySet, elementMap){
    validMessages = [];
    originMessages  = new Map();
    totalMessages = [];
    for(let message of messages){
        // Filter invalid messages
        if(elementMap.has(message.from) && elementMap.has(message.to)){
            totalMessages.push(message);
            originMessages.set(message.id, {from:message.from, to:message.to});
        }
    }

    // if the message is from/to elements in a grouped group, change the from/to attribute
    for(let message of totalMessages){
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
}

MessageController.prototype.getValidMessages = function(){
    return validMessages;
};

MessageController.prototype.foldUpdateStatus = function(group){
    for(let message of totalMessages){
        if(group.children.indexOf(message.from) != -1)
            message.from = group.id;
        if(group.children.indexOf(message.to) != -1)
            message.to = group.id;
    }
    updateStatus();
};

MessageController.prototype.unfoldUpdateStatus = function(display, elementMap){
    for(let message of totalMessages){
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

//Decide the validations/scales/positions/stackOffsets of messages
function updateStatus(){
    var activeStack = new ActiveStack();

    var position = MSG_HEIGHT$1 / 4;
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
            position += (activeStack.stack.length + 1) * MSG_HEIGHT$1 / 2;
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
            position += (feedBack + 1) * MSG_HEIGHT$1 / 2;
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
function SDController(objects, groups, messages){
    elementController = new ElementController(objects, groups);

    var elementMap = elementController.getElementMap();
    var mainThreadSet = new Set([0]);
    var temp = elementMap.get(0);
    while(temp.parent != -1){
        mainThreadSet.add(temp.parent);
        temp = elementMap.get(temp.parent);
    }
    messageController = new MessageController(messages, mainThreadSet, elementController.getDisplaySet(), elementMap);
}

SDController.prototype.draw = function() {
    generateLayout();

    // draw the elements
    var display = elementController.getDisplay();
    for(var i = 0; i < display.length; i++){
        drawElement(display[i]);
    }

    // draw the messages
    var validMessages = messageController.getValidMessages();
    for(let message of validMessages){
        drawMessage(message);
    }
};

function unfold(group){
    elementController.unfoldUpdateStatus(group.id);
    unfoldUpdateElements(group, elementController);

    var enabled = messageController.unfoldUpdateStatus(elementController.getDisplaySet(), elementController.getElementMap());
    updateMessages(enabled);
}

function fold(group){
    elementController.foldUpdateStatus(group.id);
    foldUpdateElements(group, elementController);

    messageController.unfoldUpdateStatus(elementController.getDisplaySet(), elementController.getElementMap());
    updateMessages([]); // When fold objects, no new message will appear
}

function allFolded(group) {
    for(var i = 0; i < group.children.length; i++){
        var e = elementController.getElementMap().get(group.children[i]);
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

/****************************************************************************
This part is "Advanced ussage" of this module.
They are used in SDViewer module to controll the display
****************************************************************************/
SDController.prototype.getMessages = function() {
    return messageController.getValidMessages();
};

SDController.prototype.getElements = function() {
    return elementController.getDisplay();
};

SDController.prototype.clearAll = function() {
    d3.select(".messages-layout").remove();
    d3.select(".objects-layout").remove();
    d3.select(".loop-layout").remove();
    d3.select(".loop-layout").remove();

    generateLayout();
};

SDController.prototype.getFoldInfo = function() {
    // Return a set of unfold groups
    return elementController.getGroupFoldInfo();
};

SDController.prototype.updateWithoutAnimation = function(unfoldSet) {
    for(let element of elementController.getDisplay()){
        if(unfoldSet.has(element.id)){
            elementController.unfoldUpdateStatus(group.id);
            unfoldUpdateElementsWithoutAnimation(group, elementController);

            var enabled = messageController.unfoldUpdateStatus(elementController.getDisplaySet(), elementController.getElementMap());
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
    var validMessages = messageController.getValidMessages();
    var y1 = 0;
    var y2 = validMessages[validMessages.length - 1].position + 80;
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
    elementController.getDisplay().forEach(function(element){
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

    elementController.getDisplay().forEach(function(element){
        ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);
    });

    var elementMap = elementController.getElementMap();
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
    var elementMap = elementController.getElementMap();

    var from = elementMap.get(message.from);
    var to = elementMap.get(message.to);
    // left active bar
    var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.fromOffset * MSG_ACTIVE_WIDTH;
    var y1 = message.position + MSG_PADDING;
    var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

    // right active bar
    var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2 + message.toOffset * MSG_ACTIVE_WIDTH;
    // console.log("message: " + message.message + ", " + message.offset);
    var y2 = y1 + MSG_PADDING;
    var h2 = h1 - 2 * MSG_PADDING;

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

    var elementMap = elementController.getElementMap();
    d3.selectAll(".message")
        .each(function(message){
            if(!message.valid){
                d3.select(this).remove();
                return;
            }
            var from = elementMap.get(message.from);
            var to = elementMap.get(message.to);

            // left active bar
            var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2;
            var y1 = message.position + MSG_PADDING;
            var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

            // right active bar
            var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2;
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
}

function updateMessagesWithoutAnimation(enabled){
    // If there are newly appear messages, draw them
    for(let message of enabled){
        if(message.valid)
            drawMessage(message);
    }

    var elementMap = elementController.getElementMap();
    d3.selectAll(".message")
        .each(function(message){
            if(!message.valid){
                d3.select(this).remove();
                return;
            }
            var from = elementMap.get(message.from);
            var to = elementMap.get(message.to);

            // left active bar
            var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2;
            var y1 = message.position + MSG_PADDING;
            var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

            // right active bar
            var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2;
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
}

exports.SDController = SDController;

Object.defineProperty(exports, '__esModule', { value: true });

})));
