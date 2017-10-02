import {default as ElementController} from "./elementController"
import {default as MessageController} from "./messageController"
var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 10;
var ELEMENT_CH_HEIGHT = 4;
var PADDING = 20;
var PADDING_GROUP = 10;

var MSG_ACTIVE_WIDTH = 10;
var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 8;

var HINT_WIDTH = 300;
var HINT_HEIGHT = 90;

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

var active;

export default function SDViewer(objects, groups, msgs){
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

    this.display = display;
    this.messages = messages;
    this.total = total;
}

SDViewer.prototype.setDiagramDisplaySize = function(x, y) {
    diagramSizeX = x;
    diagramSizeY = y;
    sizeSetted = true;
    this.setDiagramDisplayHead(0, 0);
}

SDViewer.prototype.setDiagramDisplayHead = function(x, y) {
    diagramStartObj = x;
    diagramStartMsg = y;
}

SDViewer.prototype.getMiddleObjX = function() {
    if (this.getMiddleObjIndex() < display.length){
        return display[this.getMiddleObjIndex()].x;
    }
    else {
        // Return -1 means rightest part is displayed
        return -1;
    }
}

SDViewer.prototype.getMiddleObjIndex = function() {
    return diagramStartObj + (diagramSizeX / 2);
}

SDViewer.prototype.getHeadObjX = function() {
    return display[diagramStartObj].x;
}

SDViewer.prototype.getMiddleMsgY = function() {
    if (this.getMiddleMsgIndex() < messages.length){
        return messages[this.getMiddleMsgIndex()].position;
    }
    else {
        // Return -1 means bottom part is displayed
        return -1;
    }
}

SDViewer.prototype.getMiddleMsgIndex = function() {
    return diagramStartMsg + (diagramSizeY / 2);
}

SDViewer.prototype.getHeadMsgY = function() {
    return messages[diagramStartMsg].position;
}

function updateTopY() {
    var top = 0;
    for(var i = diagramStartObj; i < diagramStartObj + diagramSizeX; i++){
        if(i >= display.length)
            break;
        top = Math.min(display[i].y, top);
    }

    var oldVBY = parseInt(d3.select(".objects-layout").attr("transform").split(/,|\)/)[1]);
    if(SDViewer.prototype.top == undefined){
        d3.select(".objects-layout")
            .attr("transform", "translate(0," + (oldVBY - top)  + ")");
        SDViewer.prototype.top = top;
    }
    else if(SDViewer.prototype.top != top){
        d3.select(".objects-layout")
            .attr("transform", "translate(0," + (oldVBY + SDViewer.prototype.top - top)  + ")");
        SDViewer.prototype.top = top;
    }
}

SDViewer.prototype.getTopY = function() {
    return this.top;
}

SDViewer.prototype.drawAll = function() {
    // Draw elements (groups and objects)
    display.forEach(function(element){
        drawElement(element);
    });
    updateTopY();

    // Draw main thread's active block
    drawMainThread();

    // Draw messages
    messages.forEach(function(message){
        drawMessage(message);
    });
}

SDViewer.prototype.drawPart = function() {
    for(var i = diagramStartObj; i < diagramStartObj + diagramSizeX; i++){
        if(i >= display.length)
            break;
        drawElement(display[i]);
    }
    drawMainThread();
    for(var i = diagramStartMsg; i < diagramStartMsg + diagramSizeY; i++){
        if(i >= messages.length)
            break;
        drawMessage(messages[i]);
    }
    updateTopY();
}

SDViewer.prototype.clearAll = function() {
    d3.select(".messages-layout").remove();
    d3.select(".objects-layout").remove();
    d3.select(".loop-layout").remove();

    generateLayout();
}

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
        .attr("class", "objects-layout")
        .attr("transform", "translate(0, 0)");
}

function drawMainThread(){
    var lastValidMsg = messageController.lastValidMsg;
    var firstValidMsg = messageController.firstValidMsg;
    var h = lastValidMsg.position - firstValidMsg.position + MSG_HEIGHT + 4 * MSG_PADDING;
    mainThread.forEach(function(id){
        var mainThreadObj = total.get(id);
        var x = mainThreadObj.x + mainThreadObj.width / 2 - MSG_ACTIVE_WIDTH / 2;
        var y = firstValidMsg.position;
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
        var y = firstValidMsg.position;
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

    // Message info block
    tempG.append("rect")
        .attr("class", "message-click-active-block")
        .attr({x: -PADDING, y: -PADDING, width: 2 * PADDING + Math.abs(x2 - x1), height: 2 * PADDING + h2})
        .attr("transform", "translate(" + Math.min(x1,x2) + "," + y2 + ")")
        .style("fill", "#99ccff")
        .style("fill-opacity", "0")
        .datum(message.id);

    tempG.attr("class", "message")
        .datum(message)
        .on("click", function(thisMessage){
            var thisActive = d3.select(this).select(".message-click-active-block");
            if(active != undefined){
                active.style("fill-opacity", "0");
                if(active.datum() != thisActive.datum()){
                    thisActive.style("fill-opacity", "0.4");
                    active = thisActive;
                    var curX = d3.mouse(this)[0];
                    var curY = d3.mouse(this)[1];
                    d3.select(".hint-box").remove();
                    addHint(message.from, message.to, message.message, curX, curY);
                }
                else{
                    active = undefined;
                    d3.select(".hint-box").remove();
                }
            }
            else{
                thisActive.style("fill-opacity", "0.4");
                active = thisActive;
                var curX = d3.mouse(this)[0];
                var curY = d3.mouse(this)[1];
                addHint(message.from, message.to, message.message, curX, curY);
            }
        });
}

function addHint(from, to, msg, curX, curY){
    var tempG = d3.select("svg")
                    .append("g")
                    .attr("class", "hint-box");

    var fromT = total.get(from).name;
    var toT = total.get(to).name;

    var scale = 1;
    var viewBox = d3.select("svg");
    if(viewBox[0][0] != null){
        viewBox = viewBox.attr("viewBox")
        var windowX = window.innerWidth;
        scale = viewBox.split(" ")[2] / windowX;
    }
    var width = (Math.max(fromT.length, toT.length, msg.length) + 8) * ELEMENT_CH_WIDTH + 2 * PADDING;

    tempG.append("rect")
        .attr({x: 0, y: 0, width: width, height: HINT_HEIGHT})
        .style("fill", "#FEF8DE")
        .style("stroke", "black");

    tempG.append("text")
        .text(function(d){ return "Caller: " + fromT; })
        .attr("transform", "translate(" + PADDING + "," + (HINT_HEIGHT / 6 + ELEMENT_CH_HEIGHT) + ")")
        .style("font-family","Courier New");

    tempG.append("text")
        .text(function(d){ return "Callee: " + toT; })
        .attr("transform", "translate(" + PADDING + "," + (HINT_HEIGHT / 2 + ELEMENT_CH_HEIGHT) + ")")
        .style("font-family","Courier New");

    tempG.append("text")
        .text(function(d){ return "Method: " + msg; })
        .attr("transform", "translate(" + PADDING + "," + (HINT_HEIGHT / 6 * 5 + ELEMENT_CH_HEIGHT) + ")")
        .style("font-family","Courier New");

    tempG.attr("transform", "translate(" + curX + "," + curY + ") scale(" + scale + ")")
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
    var msgNum = (sizeSetted && diagramStartMsg + diagramSizeY < messages.length ? diagramSizeY : messageController.validMessageNum) + 1;
    var y1 = messages[diagramStartMsg].position - 80;
    var y2 = y1 + msgNum * MSG_HEIGHT + ELEMENT_PADDING / 2 + ELEMENT_HEIGHT / 2;
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

            d3.select(this).select(".message-click-active-block")
                .transition()
                .attr({x: -PADDING, y: -PADDING, width: 2 * PADDING + Math.abs(x2 - x1), height: 2 * PADDING + h2})
                .attr("transform", "translate(" + Math.min(x1,x2) + "," + y2 + ")");
        });

    var msgNum = (sizeSetted && diagramStartMsg + diagramSizeY < messages.length ? diagramSizeY : messageController.validMessageNum) + 1;
    var y2 = msgNum * MSG_HEIGHT + ELEMENT_PADDING / 2 + ELEMENT_HEIGHT / 2;
    d3.selectAll(".baseLine")
        .attr("y2", y2);
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

    updateTopY();
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

    updateTopY();
}
