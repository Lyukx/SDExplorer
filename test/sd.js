(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.sd = {})));
}(this, (function (exports) { 'use strict';

var ELEMENT_HEIGHT$2 = 40;
var ELEMENT_CH_WIDTH$2 = 10;
var PADDING$2 = 20;

function Element(rawElement) {
    this.id = rawElement.id;
    this.name = rawElement.name;
    this.parent = -1;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.height = ELEMENT_HEIGHT$2;
    this.width = this.name.length * ELEMENT_CH_WIDTH$2 + PADDING$2 * 2;
    this.fold = true;
}

Element.prototype.isGroup = function () {
    if(this.children.length == 0)
        return false;
    else
        return true;
};

var ELEMENT_CH_WIDTH$1 = 10;
var PADDING$1 = 20;
var PADDING_GROUP$1 = 10;

var total$1 = [];
var display$1 = [];

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

function ElementController(objects, groups){
    total$1 = initElement(objects, groups);
    total$1.forEach(function(element, key, map){
        if(element.parent == -1)
            display$1.push(element);
    });

    display$1.sort(function(a, b){
        var ida = a.id;
        var idb = b.id;
        if(a.isGroup()) ida = a.children[0];
        if(b.isGroup()) idb = b.children[0];
        return ida - idb;
    });

    var dist = PADDING$1;
    for(var i = 0; i < display$1.length; i++){
        display$1[i].x = dist;
        dist += (display$1[i].width + PADDING$1);
    }

    this.total = total$1;
    this.display = display$1;
}

ElementController.prototype.unfoldUpdateStatus = function(groupId){
//function unfoldUpdateStatus(groupId) {
    var thisGroup = total$1.get(groupId);
    if(!thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var dist = PADDING_GROUP$1;
    var index = display$1.indexOf(thisGroup) + 1;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = total$1.get(elementIds[i]);
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
        tempGroup = total$1.get(tempGroup.parent);
        tempGroup.width += diff;
        tempGroup.height += (2 * PADDING_GROUP$1);
        tempGroup.y -= PADDING_GROUP$1;
    }
};

ElementController.prototype.foldUpdateStatus = function(groupId){
//function foldUpdateStatus(groupId) {
    var thisGroup = total$1.get(groupId);
    if(thisGroup.fold)
        return;
    var elementIds = thisGroup.children;
    var index = 0;
    for(var i = 0; i < elementIds.length; i++){
        var thisElement = total$1.get(elementIds[i]);
        index = display$1.indexOf(thisElement);
        display$1.splice(index, 1); // Remove elements in group from display
    }

    var diff = thisGroup.width - (thisGroup.name.length * ELEMENT_CH_WIDTH$1 + PADDING$1 * 2);
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
        tempGroup = total$1.get(tempGroup.parent);
        tempGroup.width -= diff;
        tempGroup.height -= (2 * PADDING_GROUP$1);
        tempGroup.y += PADDING_GROUP$1;
    }
};

function Message(rawMessage){
    this.from = rawMessage.from;
    this.to = rawMessage.to;
    this.message = rawMessage.message;
    this.callee = rawMessage.callee;
    this.id = -1;
    this.valid = false;
    this.scale = 1;
    this.position = 0;
}

Message.prototype.equals = function(another){
    // position doesn't need to be same
    return (this.from == another.from && this.to == another.to && this.message == another.message && this.callee == another.callee && this.scale == another.scale);
};

var MSG_HEIGHT$1 = 80;
var origin$1 = [];

function MessageController(messages, mainThreads){
    this.messages = [];
    this.origin = [];
    this.mainThreads = mainThreads;
    for(var i = 0; i < messages.length; i++){
        var thisMsg = new Message(messages[i]);
        thisMsg.id = i;
        this.messages.push(thisMsg);
        this.origin.push({from:thisMsg.from, to:thisMsg.to});
    }

    origin$1 = this.origin;

    this.firstValidMsg = this.messages[0];
    this.lastValidMsg = this.messages[this.messages.length - 1];
    this.validMessages = this.messages;
}

MessageController.prototype.updateMessageInit = function(total, displaySet){
    this.messages.forEach(function(message){
        while(!displaySet.has(message.from)){
            var parent = total.get(message.from).parent;
            message.from = parent;
            if(parent == -1){
                break;
            }
        }
        while(!displaySet.has(message.to)){
            var parent = total.get(message.to).parent;
            message.to = parent;
            if(parent == -1){
                break;
            }
        }
    });
};

MessageController.prototype.updateMessageOnFold = function(group){
    this.messages.forEach(function(message){
        if(group.children.indexOf(message.from) != -1)
            message.from = group.id;
        if(group.children.indexOf(message.to) != -1)
            message.to = group.id;
    });
};

MessageController.prototype.updateMessageOnUnfold = function(total, displaySet){
    this.messages.forEach(function(message){
        if(!displaySet.has(message.from)){
            message.from = origin$1[message.id].from;
            while(!displaySet.has(message.from)){
                var parent = total.get(message.from).parent;
                message.from = parent;
                if(parent == -1){
                    break;
                }
            }
        }
        if(!displaySet.has(message.to)){
            message.to = origin$1[message.id].to;
            while(!displaySet.has(message.to)){
                var parent = total.get(message.to).parent;
                message.to = parent;
                if(parent == -1){
                    break;
                }
            }
        }
    });
};

MessageController.prototype.updateStatus = function(){
    var activeSet = new Set();
    var activeStartMsgId;
    var position = 0;
    var validMessageNum = 0;
    var enabledMessages = [];
    var feedBack = 0;
    this.validMessages = [];

    for(var i = 0; i < this.messages.length; i++){
        var thisMsg = this.messages[i];
        // Invalid message
        if(thisMsg.to == thisMsg.from || thisMsg.from == -1 || thisMsg.to == -1){
            thisMsg.valid = false;
        }
        // Message from main thread
        else if(this.mainThreads.has(thisMsg.from)){
            activeSet.clear();
            activeSet.add(thisMsg.to);
            if(!thisMsg.valid)
                enabledMessages.push(thisMsg);
            thisMsg.valid = true;
            thisMsg.scale = 1;
            position += MSG_HEIGHT$1 + feedBack;
            feedBack = 0;
            thisMsg.position = position;
            activeStartMsgId = thisMsg.id;
            validMessageNum ++;
            this.validMessages.push(thisMsg);
        }

        // Message from active class
        else if(activeSet.has(thisMsg.from)){
            activeSet.add(thisMsg.to);
            if(!thisMsg.valid)
                enabledMessages.push(thisMsg);
            thisMsg.valid = true;
            thisMsg.scale = 1;
            // Decide the position
            var lastMsg = this.messages[i - 1];
            if(thisMsg.from == lastMsg.to){
                position += MSG_HEIGHT$1 / 2;
                thisMsg.position = position;
                feedBack += MSG_HEIGHT$1 / 2;
            }
            else{
                var nest = 0;
                var tempMsg = lastMsg;
                while(tempMsg.from != thisMsg.from){
                    nest += MSG_HEIGHT$1 / 2;
                    feedBack -= MSG_HEIGHT$1 / 2;
                    tempMsg = this.messages[tempMsg.id - 1];
                }
                position += MSG_HEIGHT$1 + nest;
                thisMsg.position = position;
            }
            // Change the scale of messages from main thread
            for(var j = activeStartMsgId; j < i; j++){
                this.messages[j].scale += 1;
                if(this.messages[j].to == thisMsg.from)
                    break;
            }
            validMessageNum ++;
            this.validMessages.push(thisMsg);
        }
        else{ // not valid message
            thisMsg.valid = false;
        }
    }

    var lastValidMsg = null;
    var firstValidMsg = null;
    for(var i = this.messages.length - 1; i >= 0; i--){
        var thisMsg = this.messages[i];
        if(thisMsg.valid){
            lastValidMsg = thisMsg;
            break;
        }
    }
    for(var i = 0; i < this.messages.length; i++){
        var thisMsg = this.messages[i];
        if(thisMsg.valid){
            firstValidMsg = thisMsg;
            break;
        }
    }
    this.firstValidMsg = firstValidMsg;
    this.lastValidMsg = lastValidMsg;
    this.validMessageNum = validMessageNum;
    return enabledMessages;
};

var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_HEIGHT = 4;
var PADDING = 20;
var PADDING_GROUP = 10;

var MSG_ACTIVE_WIDTH = 10;
var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 8;

var ELEMENT_PADDING = ELEMENT_HEIGHT;

var total = [];
var display = [];
var elementController;
var messages = [];
var origin = [];
var mainThread; //TODO add multi-thread
var messageController;

// Set and control display window
var diagramSizeX;
var diagramSizeY;
var sizeSetted;
var diagramStartObj;
var diagramStartMsg;

function SDViewer(objects, groups, msgs){
    var ec = new ElementController(objects, groups);
    elementController = ec;
    total = ec.total;
    display = ec.display;

    // TODO add multi-thread
    var mainThreadSet = new Set();
    mainThreadSet.add(0);
    var tempMain = total.get(0);
    while(tempMain.parent != -1){
        mainThreadSet.add(tempMain.parent);
        tempMain = total.get(tempMain.parent);
    }
    mainThread = mainThreadSet;

    var displaySet = new Set();
    display.forEach(function(element){
        if(!(element.isGroup() && !element.fold))
            displaySet.add(element.id);
    });
    var mc = new MessageController(msgs, mainThreadSet);
    mc.updateMessageInit(total, displaySet);
    mc.updateStatus();
    messages = mc.validMessages;
    origin = mc.origin;
    messageController = mc;

    generateLayout();

    sizeSetted = false;
}

SDViewer.prototype.setDiagramDisplaySize = function(x, y) {
    diagramSizeX = x;
    diagramSizeY = y;
    sizeSetted = true;
    this.setDiagramDisplayHead(0, 0);
};

SDViewer.prototype.setDiagramDisplayHead = function(x, y) {
    diagramStartObj = x;
    diagramStartMsg = y;
};

SDViewer.prototype.getMiddleObjX = function() {
    if (this.getMiddleObjIndex() < display.length){
        return display[this.getMiddleObjIndex()].x;
    }
    else {
        // Return -1 means rightest part is displayed
        return -1;
    }
};

SDViewer.prototype.getMiddleObjIndex = function() {
    return diagramStartObj + (diagramSizeX / 2);
};

SDViewer.prototype.getHeadObjX = function() {
    return display[diagramStartObj].x;
};

SDViewer.prototype.getMiddleMsgY = function() {
    if (this.getMiddleMsgIndex() < messages.length){
        return messages[this.getMiddleMsgIndex()].position;
    }
    else {
        // Return -1 means bottom part is displayed
        return -1;
    }
};

SDViewer.prototype.getMiddleMsgIndex = function() {
    return diagramStartMsg + (diagramSizeY / 2);
};

SDViewer.prototype.getHeadMsgY = function() {
    return messages[diagramStartMsg].position;
};

SDViewer.prototype.drawAll = function() {
    // Draw elements (groups and objects)
    display.forEach(function(element){
        drawElement(element);
    });

    // Draw main thread's active block
    drawMainThread();

    // Draw messages
    messages.forEach(function(message){
        drawMessage(message);
    });
};

SDViewer.prototype.drawPart = function() {
    for(var i = diagramStartObj; i < diagramStartObj + diagramSizeX; i++){
        if(i >= display.length)
            break;
        drawElement(display[i]).x;
    }
    for(var i = diagramStartMsg; i < diagramStartMsg + diagramSizeY; i++){
        if(i >= messages.length)
            break;
        drawMessage(messages[i]);
    }
};

SDViewer.prototype.clearAll = function() {
    d3.select(".messages-layout").remove();
    d3.select(".objects-layout").remove();
    d3.select(".loop-layout").remove();

    generateLayout();
};

function generateLayout() {
    // Add layouts into svg
    d3.select("svg")
        .append("g")
        .attr("class", "baseline-layout");
    d3.select("svg")
        .append("g")
        .attr("class", "messages-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "loop-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "objects-layout");
}

function drawMainThread(){
    var lastValidMsg = messageController.lastValidMsg;
    var firstValidMsg = messageController.firstValidMsg;
    var h = lastValidMsg.position - firstValidMsg.position + MSG_HEIGHT + 4 * MSG_PADDING;
    mainThread.forEach(function(id){
        var mainThreadObj = total.get(id);
        var x = mainThreadObj.x + mainThreadObj.width / 2 - MSG_ACTIVE_WIDTH / 2;
        var y = firstValidMsg.position - 2 * MSG_PADDING;
        d3.select(".messages-layout").append("rect")
                .attr("class", "mainThreadActiveBar")
                .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h})
                .attr("transform", "translate(" + x + "," + y + ")")
                .style("stroke", "black")
                .style("fill", "#CCC");
    });
}

function updateMainThread(){
    var lastValidMsg = messageController.lastValidMsg;
    var firstValidMsg = messageController.firstValidMsg;
    var h = lastValidMsg.position - firstValidMsg.position + MSG_HEIGHT + 4 * MSG_PADDING;
    var displaySet = new Set();
    display.forEach(function(element){
        if(!(element.isGroup() && !element.fold))
            displaySet.add(element.id);
    });
    mainThread.forEach(function(id){
        if(!displaySet.has(id)){
            return;
        }
        var mainThreadObj = total.get(id);
        var x = mainThreadObj.x + mainThreadObj.width / 2 - MSG_ACTIVE_WIDTH / 2;
        var y = firstValidMsg.position - 2 * MSG_PADDING;
        d3.select(".mainThreadActiveBar")
                .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h})
                .attr("transform", "translate(" + x + "," + y + ")");
    });
}

function unfold(group){
    elementController.unfoldUpdateStatus(group.id);
    var displaySet = new Set();
    display.forEach(function(element){
        if(!(element.isGroup() && !element.fold))
            displaySet.add(element.id);
    });
    messageController.updateMessageOnUnfold(total, displaySet);
    var enable = messageController.updateStatus();
    unfoldUpdateSVG(group, enable);
    updateMainThread();
}

function fold(group){
    elementController.foldUpdateStatus(group.id);
    messageController.updateMessageOnFold(group);
    messageController.updateStatus();
    foldUpdateSVG(group);
    updateMainThread();
}

function drawMessage(message) {
    var from = total.get(message.from);
    var to = total.get(message.to);
    // left active bar
    var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2;
    var y1 = message.position + MSG_PADDING;
    var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

    // left side of the right active bar
    var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2;
    var y2 = y1 + MSG_PADDING;
    var h2 = h1 - 2 * MSG_PADDING;
    if(sizeSetted){
        var xMin = diagramStartObj > 0 ? display[diagramStartObj - 1].x : display[0].x;
        var last = diagramStartObj + diagramSizeX;
        if(last >= display.length)
            last = display.length - 1;
        var xMax = display[last].x;
        if(x1 < xMin)
            x1 = xMin;
        if(x2 > xMax)
            x2 = xMax;
    }

    var leftToRight = (total.get(message.from).x < total.get(message.to).x);

    var tempG = d3.select(".messages-layout").append("g");

    // Write messages
    if(leftToRight){
        tempG.append("text")
            .attr("class", "message-text")
            .text(function(d){ return message.message; })
            .attr("transform", "translate(" + (x1 + PADDING) + "," + y1 + ")");
    }
    else{
        tempG.append("text")
            .attr("class", "message-text")
            .text(function(d){ return message.message; })
            .attr("transform", "translate(" + (x1 - MSG_ACTIVE_WIDTH) + "," + y1 + ")")
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

    // Draw callback line
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

function allFolded(group) {
    for(var i = 0; i < group.children.length; i++){
        var e = total.get(group.children[i]);
        if(e.isGroup() && !e.fold)
            return false;
    }
    return true;
}

function drawElement(element) {
    var tempG = d3.select(".objects-layout").append("g");
    // Draw base line
    var x = element.width / 2;
    // a fixed length
    var msgNum = (sizeSetted ? diagramSizeY : messageController.validMessageNum) + 1;
    var y2 = msgNum * MSG_HEIGHT + ELEMENT_PADDING / 2 + ELEMENT_HEIGHT / 2;
    d3.select(".baseline-layout").append("line")
        .attr("class", "baseLine")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y2)
        .style("stroke", "black")
        .style("stroke-dasharray", "2,2,2")
        .attr("id", "baseLine" + element.id)
        .attr("transform", "translate(" + element.x + ", " + element.y + ")");

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

function updateMsgSVG(){
    d3.selectAll(".message")
        .each(function(message){
            if(!message.valid){
                d3.select(this).remove();
                return;
            }
            var from = total.get(message.from);
            var to = total.get(message.to);

            // left active bar
            var x1 = from.x + from.width / 2 - MSG_ACTIVE_WIDTH / 2;
            var y1 = message.position + MSG_PADDING;
            var h1 = message.scale * MSG_HEIGHT - 2 * MSG_PADDING;

            // left side of the right active bar
            var x2 = to.x + to.width / 2 - MSG_ACTIVE_WIDTH / 2;
            var y2 = y1 + MSG_PADDING;
            var h2 = h1 - 2 * MSG_PADDING;

            var leftToRight = (total.get(message.from).x < total.get(message.to).x);

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
        });

    d3.selectAll(".baseLine")
        .attr("y2", (messageController.lastValidMsg.position - messageController.firstValidMsg.position + 2 * MSG_HEIGHT) + ELEMENT_PADDING / 2 + ELEMENT_HEIGHT / 2);
}

function unfoldUpdateSVG(thisGroup, enable) {
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

                    // hide the baseline
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

    display.forEach(function(element){ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);});

    for(var i = 0; i < thisGroup.children.length; i++){
        var elementId = thisGroup.children[i];
        var thisElement = total.get(elementId);
        var temp = drawElement(thisElement);
        temp.attr("transform", "translate(" + thisGroup.x + ", " + (thisGroup.y + PADDING_GROUP) + ")");
        temp.transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
        d3.select("#baseLine" + elementId)
            .transition()
            .attr("transform", "translate(" + thisElement.x + ", " + thisElement.y + ")");
    }

    // If there are newly appear messages, draw them
    enable.forEach(function(message){
        drawMessage(message);
    });

    // Update messages
    updateMsgSVG();
}

function foldUpdateSVG(thisGroup) {
    d3.selectAll(".element-rectangle")
        .each(function(element){
            if(thisGroup.children.indexOf(element.id) != -1){
                d3.select("#baseLine" + element.id).remove();
                d3.select(this).remove();
            }
            else if(element.isGroup()){
                d3.select(this).select("rect")
                    .transition()
                    .attr({width: element.width, height:element.height});

                ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);

                if(element == thisGroup){
                    d3.select(this)
                        .transition()
                        .style("fill-opacity", "1")
                        .attr("transform", "translate(" + element.x + ", " + element.y + ")");
                    // show the baseline
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
    display.forEach(function(element){ELEMENT_PADDING = Math.max(ELEMENT_PADDING, element.height);});
    // Update messages
    updateMsgSVG();
}

var svg;
var sdv;
var viewBox_y;
var viewBox_x;
// note headX and headY are indexes
var headX = 0;
var headY = 0;

var diagramSizeX$1 = 126;
var diagramSizeY$1 = 180;

function SVG(objects, groups, messages) {
    setSVG();
    sdv = new SDViewer(objects, groups, messages);
    //sdv.drawAll();
    sdv.setDiagramDisplaySize(diagramSizeX$1, diagramSizeY$1);
    sdv.setDiagramDisplayHead(headX, headY);
    sdv.drawPart();
}

function onDiagramMoved() {
    if(sdv.getMiddleObjX() != -1){
        if(viewBox_x >= sdv.getMiddleObjX()){
            //console.log(viewBox_x);
            updateSvg(sdv.getMiddleObjIndex(), headY);
        }
    }
    if(headX > 0 && viewBox_x <= sdv.getHeadObjX()){
        updateSvg(headX - (diagramSizeX$1 / 2), headY);
    }

    if(sdv.getMiddleMsgY() != -1){
        if(viewBox_y >= sdv.getMiddleMsgY()){
            updateSvg(headX, sdv.getMiddleMsgIndex());
        }
    }
    if(headY > 0 && viewBox_y <= sdv.getHeadMsgY()){
        updateSvg(headX, headY - (diagramSizeY$1 / 2));
    }
    keepElementTop();
}
function updateSvg(x, y) {
    sdv.clearAll();
    headX = x;
    headY = y;
    sdv.setDiagramDisplayHead(x, y);
    sdv.drawPart();
}

function keepElementTop() {
    if(viewBox_y > 0){
        d3.select(".objects-layout")
            .attr("transform", "translate(0," + viewBox_y + ")");
    }
}

function setSVG(){
    // Set svg zoomable and draggable
    var width = window.innerWidth,
        height = window.innerHeight;
    var curPos_x, curPos_y, mousePos_x, mousePos_y;
    var isMouseDown, oldScale = 1;
    viewBox_x = - 10;
    viewBox_y = - 10;
    svg = d3.select("#drawArea")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .call(d3.behavior.zoom()
                	.scaleExtent([0.1, 10])
                	.on("zoom", function () {
    	                if (oldScale !== d3.event.scale) {
    	                    var scale = oldScale / d3.event.scale;
    	                    oldScale = d3.event.scale;
    	                    viewBox_x = curPos_x - scale * (curPos_x - viewBox_x);
    	                    viewBox_y = curPos_y - scale * (curPos_y - viewBox_y);
    	                    svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
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
        viewBox_x = viewBox_x - d3.mouse(this)[0] + mousePos_x;
        viewBox_y = viewBox_y - d3.mouse(this)[1] + mousePos_y;
        svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
        onDiagramMoved();
    });

    svg.on("mousemove", function () {
        curPos_x = d3.mouse(this)[0];
        curPos_y = d3.mouse(this)[1];
        if (isMouseDown) {
            viewBox_x = viewBox_x - d3.mouse(this)[0] + mousePos_x;
            viewBox_y = viewBox_y - d3.mouse(this)[1] + mousePos_y;
            svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
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

exports.SDViewer = SDViewer;
exports.SVG = SVG;

Object.defineProperty(exports, '__esModule', { value: true });

})));
