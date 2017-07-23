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
    var activeStartMsgId;
    var position = 0;
    var validMessageNum = 0;
    var enabledMessages = [];
    for(var i = 0; i < this.messages.length; i++){
        var thisMsg = this.messages[i];
        if(thisMsg.to == thisMsg.from || thisMsg.from == -1 || thisMsg.to == -1){
            thisMsg.valid = false;
        }
        else if(this.mainThreads.has(thisMsg.from)){
            activeSet.clear();
            activeSet.add(thisMsg.to);
            if(!thisMsg.valid)
                enabledMessages.push(thisMsg);
            thisMsg.valid = true;
            thisMsg.scale = 1;
            position += MSG_HEIGHT;
            thisMsg.position = position;
            activeStartMsgId = thisMsg.id;
            validMessageNum ++;
        }
        else if(activeSet.has(thisMsg.from)){
            activeSet.add(thisMsg.to);
            if(!thisMsg.valid)
                enabledMessages.push(thisMsg);
            thisMsg.valid = true;
            thisMsg.scale = 1;
            // Decide the position
            var lastMsg = this.messages[i - 1];
            if(thisMsg.from == lastMsg.to){
                position += MSG_HEIGHT / 2;
                thisMsg.position = position;
                position += MSG_HEIGHT / 2;
            }
            else{
                position += MSG_HEIGHT;
                thisMsg.position = position;
            }
            // Change the scale of messages from main thread
            for(var j = activeStartMsgId; j < i; j++){
                this.messages[j].scale += 1;
                if(this.messages[j].to == thisMsg.from)
                    break;
            }
            validMessageNum ++;
        }
        else{ // not valid message
            thisMsg.valid = false;
        }
    }

    this.validMessageNum = validMessageNum;
    return enabledMessages;
}
