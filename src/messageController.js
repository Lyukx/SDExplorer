import {Message} from "./message";

var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 4;

var origin = [];

export default function MessageController(messages, mainThreads){
    this.messages = [];
    this.origin = [];
    this.mainThreads = mainThreads;
    for(var i = 0; i < messages.length; i++){
        var thisMsg = new Message(messages[i]);
        thisMsg.id = i;
        this.messages.push(thisMsg);
        this.origin.push({from:thisMsg.from, to:thisMsg.to});
    }

    origin = this.origin;

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
}

MessageController.prototype.updateMessageOnFold = function(group){
    this.messages.forEach(function(message){
        if(group.children.indexOf(message.from) != -1)
            message.from = group.id;
        if(group.children.indexOf(message.to) != -1)
            message.to = group.id;
    });
}

MessageController.prototype.updateMessageOnUnfold = function(total, displaySet){
    this.messages.forEach(function(message){
        if(!displaySet.has(message.from)){
            message.from = origin[message.id].from;
            while(!displaySet.has(message.from)){
                var parent = total.get(message.from).parent;
                message.from = parent;
                if(parent == -1){
                    break;
                }
            }
        }
        if(!displaySet.has(message.to)){
            message.to = origin[message.id].to;
            while(!displaySet.has(message.to)){
                var parent = total.get(message.to).parent;
                message.to = parent;
                if(parent == -1){
                    break;
                }
            }
        }
    });
}

MessageController.prototype.updateStatus = function(){
    var activeSet = new Set();
    var activeStack = [];
    var position = MSG_HEIGHT / 4;
    var validMessageNum = 0;
    var enabledMessages = [];
    var feedBack = 0;
    this.validMessages = [];

    var lastValidMsg;

    for(var i = 0; i < this.messages.length; i++){
        var thisMsg = this.messages[i];
        // Invalid message
        if(thisMsg.to == thisMsg.from || thisMsg.from == -1 || thisMsg.to == -1){
            thisMsg.valid = false;
        }

        // Message from main thread
        else if(this.mainThreads.has(thisMsg.from)){
            position += (activeStack.length + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // Add the message into active stack
            activeStack = [];
            activeStack.push(thisMsg);
            activeSet.clear();
            activeSet.add(thisMsg.to);
            if(!thisMsg.valid)
                enabledMessages.push(thisMsg);
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessageNum ++;
            this.validMessages.push(thisMsg);
            lastValidMsg = thisMsg;
        }

        // Active Stack is not empty and the message is from active object
        else if(activeSet.has(thisMsg.from)){
            if(!thisMsg.valid)
                enabledMessages.push(thisMsg);
            thisMsg.valid = true;
            thisMsg.scale = 1;
            validMessageNum ++;
            this.validMessages.push(thisMsg);

            // Decide the position
            var feedBack = 0;
            // After loop the peek of the stack is the last valid message in the call chain
            while(peek(activeStack).to != thisMsg.from){
                var top = activeStack.pop();
                activeSet.delete(top);
                feedBack += 1;
            }
            position += (feedBack + 1) * MSG_HEIGHT / 2;
            thisMsg.position = position;
            // Change the scale of messages in the call chain
            activeStack.forEach(function(msg){
                msg.scale += 1;
            });
            // Add the message into active set & stack
            activeStack.push(thisMsg);
            activeSet.add(thisMsg.to);
        }

        // Message come from non-active and non-main-thread objects
        else{
            thisMsg.valid = false;
        }
    }

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
}

function updateScale(activeStack){
    activeStack.forEach(function(msg){
        msg.scale += 1;
    });
}

function peek(activeStack){
    return activeStack[activeStack.length - 1];
}
