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

var total = [];
var display = [];
var elementController;
var messages = [];
var origin = [];
var mainThread; //TODO add multi-thread
var messageController;

export default function SDViewer(objects, groups, msgs){
    var ec = new ElementController(objects, groups);
    elementController = ec;
    total = ec.total;
    display = ec.display;

    // TODO add multi-thread
    var mainThreadSet = new Set();
    mainThreadSet.add(0);
    mainThread = mainThreadSet;

    var displaySet = new Set();
    display.forEach(function(element){
        if(!(element.isGroup() && !element.fold))
            displaySet.add(element.id);
    });
    var mc = new MessageController(msgs, mainThreadSet);
    mc.updateMessageInit(total, displaySet);
    mc.updateStatus();
    messages = mc.messages;
    origin = mc.origin;
    messageController = mc;
}

SDViewer.prototype.drawAll = function() {
    d3.select("svg")
        .append("g")
        .attr("class", "objects-layout");

    d3.select("svg")
        .append("g")
        .attr("class", "messages-layout");

    // Draw elements (groups and objects)
    display.forEach(function(element){
        drawElement(element);
    });

    // Draw main thread's active block
    var h = messageController.validMessageNum * MSG_HEIGHT;
    mainThread.forEach(function(id){
        var mainThreadObj = total.get(id);
        var x = mainThreadObj.x + mainThreadObj.width / 2 - MSG_ACTIVE_WIDTH / 2;
        var y = MSG_HEIGHT;
        d3.select(".messages-layout").append("rect")
                .attr("class", "mainThreadActiveBar")
                .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h})
                .attr("transform", "translate(" + x + "," + y + ")")
                .style("stroke", "black")
                .style("fill", "#CCC");
    });

    // Draw messages
    messages.forEach(function(message){
        if(message.valid)
            drawMessage(message);
    });
};

function unfold(group){
    elementController.unfoldUpdateStatus(group.id);
    var displaySet = new Set();
    display.forEach(function(element){
        if(!(element.isGroup() && !element.fold))
            displaySet.add(element.id);
    });
    messageController.updateMesageOnUnfold(group, total, displaySet);
    var enable = messageController.updateStatus();
    unfoldUpdateSVG(group, enable);
}

function fold(group){
    elementController.foldUpdateStatus(group.id);
    messageController.updateMesageOnFold(group);
    messageController.updateStatus();
    foldUpdateSVG(group);
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

    var tempG = d3.select(".messages-layout").append("g");
    // Draw left active bar if needed
    if(!mainThread.has(message.from)){
        tempG.append("rect")
            .attr("class", "leftActiveBlock")
            .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h1})
            .attr("transform", "translate(" + x1 + "," + y1 + ")")
            .style("stroke", "black")
		    .style("fill", "#CCC");
    }

    // Draw call line
    tempG.append("line")
			.attr("class", "callLine")
            .style("stroke", "black")
            .attr("x1", (message.from < message.to) ? x1 + MSG_ACTIVE_WIDTH : x1)
            .attr("y1", y2)
            .attr("x2", (message.from < message.to) ? x2 : x2 + MSG_ACTIVE_WIDTH)
            .attr("y2", y2)
            .attr("marker-end", "url(#end)");

    // Draw callback line
    tempG.append("line")
			.attr("class", "callBackLine")
            .style("stroke", "black")
            .style("stroke-dasharray", "5, 5, 5")
            .attr("x1", (message.from < message.to) ? x2 : x2 + MSG_ACTIVE_WIDTH)
            .attr("y1", y2 + h2)
            .attr("x2", (message.from < message.to) ? x1 + MSG_ACTIVE_WIDTH : x1)
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
    var y2 = (messageController.validMessageNum + 1) * MSG_HEIGHT;
    tempG.append("line")
        .attr("class", "baseLine")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y2)
        .style("stroke", "black")
        .style("stroke-dasharray", "2,2,2")

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

            if(!mainThread.has(message.from)){
                d3.select(this).select(".leftActiveBlock")
                    .transition()
                    .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h1})
                    .attr("transform", "translate(" + x1 + "," + y1 + ")");
            }

            d3.select(this).select(".callLine")
                .transition()
                .attr("x1", (message.from < message.to) ? x1 + MSG_ACTIVE_WIDTH : x1)
                .attr("y1", y2)
                .attr("x2", (message.from < message.to) ? x2 : x2 + MSG_ACTIVE_WIDTH)
                .attr("y2", y2);

            d3.select(this).select(".callBackLine")
                .transition()
                .attr("x1", (message.from < message.to) ? x2 : x2 + MSG_ACTIVE_WIDTH)
                .attr("y1", y2 + h2)
                .attr("x2", (message.from < message.to) ? x1 + MSG_ACTIVE_WIDTH : x1)
                .attr("y2", y2 + h2);

            d3.select(this).select(".rightActiveBlock")
                .transition()
                .attr({x: 0, y: 0, width: MSG_ACTIVE_WIDTH, height: h2})
                .attr("transform", "translate(" + x2 + "," + y2 + ")")
        });
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

                    d3.select(this).select(".baseLine")
                        .attr("y2", 0);
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

    // If there are newly appear messages, draw them
    enable.forEach(function(message){
        drawElement(message);
    });

    // Update messages
    updateMsgSVG();
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
                    d3.select(this).select(".baseLine")
                        .attr("y2", (messageController.validMessageNum + 1) * MSG_HEIGHT);
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
    // Update messages
    updateMsgSVG();
}
