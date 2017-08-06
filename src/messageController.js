import {Message} from "./message";
import {Loop} from "./loop";
import {LoopDetector} from "./loopDetector";

var MSG_HEIGHT = 80;
var MSG_PADDING = MSG_HEIGHT / 4;

var origin = [];
var loopDetector;

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
    loopDetector = new LoopDetector();
    this.loops = loopDetector.detect(messages);
    this.loopStealthSet = loopDetector.getAllStealth();

    this.firstValidMsg = this.messages[0];
    this.lastValidMsg = this.messages[this.messages.length - 1];
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
    var position = - MSG_HEIGHT / 2;
    var validMessageNum = 0;
    var enabledMessages = [];
    var feedBack = 0;

    this.loops = loopDetector.detect(this.messages);
    this.loopStealthSet = loopDetector.getAllStealth();
    var loopStartSet = loopDetector.getAllLoopStart();
    var loopEndSet = loopDetector.getAllLoopEnd();

    for(var i = 0; i < this.messages.length; i++){
        var thisMsg = this.messages[i];
        // Invalid message
        if(thisMsg.to == thisMsg.from || thisMsg.from == -1 || thisMsg.to == -1){
            thisMsg.valid = false;
        }
        else if(this.loopStealthSet.has(thisMsg.id)){
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
            if(loopStartSet.has(thisMsg.id)){
                position += 2 * MSG_PADDING;
            }
            position += MSG_HEIGHT + feedBack;
            feedBack = 0;
            thisMsg.position = position;
            activeStartMsgId = thisMsg.id;
            validMessageNum ++;
            if(loopEndSet.has(thisMsg.id)){
                position += MSG_PADDING;
            }
        }

        // Message from active class
        else if(activeSet.has(thisMsg.from)){
            activeSet.add(thisMsg.to);
            if(!thisMsg.valid)
                enabledMessages.push(thisMsg);
            thisMsg.valid = true;
            thisMsg.scale = 1;
            // Decide the position
            if(loopStartSet.has(thisMsg.id)){
                position += 2 * MSG_PADDING;
            }
            var lastMsg = this.messages[i - 1];
            if(thisMsg.from == lastMsg.to){
                position += MSG_HEIGHT / 2;
                thisMsg.position = position;
                feedBack += MSG_HEIGHT / 2;
            }
            else{
                var nest = 0;
                var tempMsg = lastMsg;
                while(tempMsg.from != thisMsg.from){
                    nest += MSG_HEIGHT / 2;
                    feedBack -= MSG_HEIGHT / 2;
                    tempMsg = this.messages[tempMsg.id - 1];
                }
                position += MSG_HEIGHT + nest;
                thisMsg.position = position;
            }
            // Change the scale of messages from main thread
            for(var j = activeStartMsgId; j < i; j++){
                this.messages[j].scale += 1;
                if(this.messages[j].to == thisMsg.from)
                    break;
            }
            validMessageNum ++;
            if(loopEndSet.has(thisMsg.id)){
                position += MSG_PADDING;
            }
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
}
