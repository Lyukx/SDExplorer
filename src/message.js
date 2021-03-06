export function Message(rawMessage){
  this.from = rawMessage.from;
  this.id = rawMessage.id;
  this.count = rawMessage.count;
  this.valid = false;
  this.scale = 1;
  this.position = 0;
  this.fromOffset = 0;
  this.toOffset = 0;
  if(rawMessage.return != true){
    if(rawMessage.to == -1){
      //support old format
      this.return = true;
    }
    else{
      this.to = rawMessage.to;
      this.message = rawMessage.message;
    }
  }
  else{
    this.return = rawMessage.return;
  }
  if(rawMessage.thread != undefined){
    this.thread = rawMessage.thread;
  }
}

Message.prototype.equals = function(another){
  // position doesn't need to be same
  return (this.from == another.from && this.to == another.to && this.message == another.message);
}

Message.prototype.isReturn = function(){
  return this.return == true;
}
