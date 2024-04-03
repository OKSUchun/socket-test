import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

function App() {
  const [stompClient, setStompClient] = useState(null);
  const [receivedMessage, setReceivedMessage] = useState(null);
  const [roomId, setRoomId] = useState(1); // Room ID
  const [memberId, setMemberId] = useState(2); // Member ID
  const [chatMessage, setChatMessage] = useState(""); // State for chat message input

  useEffect(() => {
    const socket = new SockJS("http://localhost:8081/ws");
    // const socket = new SockJS("http://15.164.104.128:8081/ws");
    const stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
      console.log("Connected: " + frame);
      stompClient.subscribe(`/topic/rooms/${roomId}`, function (greeting) {
        console.log(greeting.body);
        setReceivedMessage(JSON.parse(greeting.body).content); // Update message content
      });
      // Subscribe to chat messages as well
      stompClient.subscribe(`/topic/rooms/${roomId}/chat`, function (message) {
        console.log(message.body);
        setReceivedMessage(JSON.parse(message.body).content); // Update message content for chat
      });
    });
    setStompClient(stompClient);
    return () => {
      if (stompClient !== null) {
        stompClient.disconnect();
      }
    };
  }, [roomId]); // Re-run useEffect when roomId changes.

  const enterRoom = () => {
    stompClient.send(`/app/rooms/${roomId}/${memberId}`, {}, JSON.stringify({}));
  };

  const sendChatMessage = () => {
    // Construct the chat message payload
    const chatRequest = { content: chatMessage };
    stompClient.send(`/app/rooms/${roomId}/chat/${memberId}`, {}, JSON.stringify(chatRequest));
  };

  return (
    <div>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter room ID"
      />
      <input
        type="text"
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        placeholder="Enter member ID"
      />
      <button onClick={enterRoom}>Enter Room</button>
      <input
        type="text"
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        placeholder="Enter chat message"
      />
      <button onClick={sendChatMessage}>Send Chat Message</button>
      {receivedMessage && <div>Message: {receivedMessage}</div>}
    </div>
  );
}

export default App;
