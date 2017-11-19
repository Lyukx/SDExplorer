import {default as ElementController} from "./elementController"
import {default as MessageController} from "./messageController"

var elementController;
var messageController;

var mainThread;

var display;
var elementMap;
var displaySet;

var validMessages;

export default function SDController(objects, groups, messages){
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
}

SDController.prototype.getMessages = function() {
    return validMessages;
}

SDController.prototype.getElements = function() {
    return display;
}

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
}

SDController.prototype.setDiagramDisplayHead = function(x, y) {
    diagramStartEle = x;
    diagramStartMsg = y;
}

SDController.prototype.getMiddleElementIndex = function() {
    return diagramStartEle + (diagramSizeX / 2);
}

SDController.prototype.getMiddleElementX = function() {
    var index = this.getMiddleElementIndex();
    if(index < display.length){
        return display[index].x;
    }
    else{
        // Returns -1 means rightest part of the sequence diagram is displayed
        return -1;
    }
}

SDController.prototype.getHeadElementX = function() {
    return display[diagramStartEle].x;
}

SDController.prototype.getMiddleMessageIndex = function() {
    return diagramStartMsg + (diagramSizeY / 2);
}

SDController.prototype.getMiddleMessageY = function() {
    var index = this.getMiddleMessageIndex();
    if (index < validMessages.length){
        return validMessages[index].position;
    }
    else {
        // Return -1 means the most bottom part of the sequence diagram is displayed
        return -1;
    }
}

SDController.prototype.getHeadMessageY = function() {
    return validMessages[diagramStartMsg].position;
}

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
}

SDController.prototype.clearAll = function() {
    d3.select(".messages-layout").remove();
    d3.select(".objects-layout").remove();
    d3.select(".loop-layout").remove();
    d3.select(".loop-layout").remove();
    d3.select(".mainthread-layout").remove();
    d3.select(".baseline-layout").remove();

    generateLayout();
}

SDController.prototype.getFoldInfo = function() {
    // Return a set of unfold groups
    return elementController.getGroupFoldInfo();
}

SDController.prototype.updateWithoutAnimation = function(unfoldSet) {
    for(let element of display){
        if(unfoldSet.has(element.id)){
            elementController.unfoldUpdateStatus(group.id);
            unfoldUpdateElementsWithoutAnimation(group, elementController);

            var enabled = messageController.unfoldUpdateStatus(displaySet, elementMap);
            updateMessagesWithoutAnimation(enabled);
        }
    }
}

/********************************************************************************************************************
Rest part is the 'render' part, which contains functions to draw / modify elements on the SVG.
*********************************************************************************************************************/
var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 10;
var ELEMENT_CH_HEIGHT = 4;

var PADDING = 20;
var PADDING_GROUP = 10;

var ELEMENT_PADDING = ELEMENT_HEIGHT;

var MSG_ACTIVE_WIDTH = 10;
var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 8;

var HINT_WIDTH = 300;
var HINT_HEIGHT = 90;

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
