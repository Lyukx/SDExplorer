var ELEMENT_HEIGHT = 40;
var ELEMENT_CH_WIDTH = 8;
var PADDING = 20;

export function Element(rawElement) {
    // Display information
    this.id = rawElement.id;
    this.displayName = rawElement.name;
    if(rawElement.type != undefined){ // objects
        this.displayName += (":" + rawElement.type);
    }

    // Grouping information
    this.parent = -1;
    this.children = [];
    this.fold = true;

    // Position infromation
    this.x = 0;
    this.y = 0;
    this.height = ELEMENT_HEIGHT;
    this.width = this.displayName.length * ELEMENT_CH_WIDTH + PADDING * 2;
}

Element.prototype.isGroup = function () {
    return this.children.length != 0;
}
