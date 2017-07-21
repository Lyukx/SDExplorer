var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 10;
var PADDING = 20;

export function Element(rawElement) {
    this.id = rawElement.id;
    this.name = rawElement.name;
    this.parent = -1;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.height = ELEMENT_HEIGHT;
    this.width = this.name.length * ELEMENT_CH_WIDTH + PADDING * 2;
    this.fold = true;
}

Element.prototype.isGroup = function () {
    if(this.children.length == 0)
        return false;
    else
        return true;
}
