export function Message(rawMessage){
    this.from = rawMessage.from;
    this.to = rawMessage.to;
    this.message = rawMessage.message;
    this.callee = rawMessage.callee;
    this.id = rawMessage.id;
    this.valid = false;
    this.scale = 1;
    this.position = 0;
    this.offset = 0;
}

Message.prototype.equals = function(another){
    // position doesn't need to be same
    return (this.from == another.from && this.to == another.to && this.message == another.message);
}
