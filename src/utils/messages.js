const generateMessage = (username, text) => {
    return {
      username,
      text,
      createdAt: new Date().getTime()
    };
  };
  
  const generateLocationMessage = (username, url) => {
    return {
      username,
      url,
      createdAt: new Date().getTime()
    };
  };
  
  const rooms = {};

const getMessagesInRoom = (room) => {
  return rooms[room] ? rooms[room].messages : [];
};

const addMessage = (room, message) => {
  if (!rooms[room]) {
    rooms[room] = { messages: [] };
  }
  rooms[room].messages.push(message);
};

module.exports = {
  getMessagesInRoom,
  addMessage,
  generateMessage,
  generateLocationMessage,
};

  