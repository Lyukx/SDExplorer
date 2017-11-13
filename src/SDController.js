import {default as ElementController} from "./elementController"
import {default as MessageController} from "./messageController"
import {generateLayout, drawElement, unfoldUpdateElements, foldUpdateElements} from "./render"

var elementController;
export default function SDController(objects, groups, messages){
    elementController = new ElementController(objects, groups);
}

SDController.prototype.draw = function() {
    generateLayout();
    var display = elementController.getDisplay();
    for(var i = 0; i < display.length; i++){
        // draw the element
        var elementItem = drawElement(display[i]);
        // add mouse events to groups
        if(display[i].isGroup()){
            elementItem.on("click", function(thisGroup){
                if(thisGroup.fold){
                    unfold(thisGroup);
                }
                else{
                    foldAll(thisGroup);
                }
            });
        }
    }
}

function unfold(group){
    elementController.unfoldUpdateStatus(group.id);
    unfoldUpdateElements(group, elementController);
}

function fold(group){
    elementController.foldUpdateStatus(group.id);
    foldUpdateElements(groups, elementController);
}

function allFolded(group) {
    for(var i = 0; i < group.children.length; i++){
        var e = elementController.getElementMap().get(group.children[i]);
        if(e.isGroup() && !e.fold)
            return false;
    }
    return true;
}

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
