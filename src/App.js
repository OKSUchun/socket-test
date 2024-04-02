import { useEffect, useState } from "react";
import "./App.css";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

function App() {
  const [stompClient, setStompClient] = useState(null);
  const [name, setName] = useState("");
  const [receivedMessage, setReceivedMessage] = useState(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
      console.log("Connected: " + frame);
      stompClient.subscribe("/topic/greetings", function (greeting) {
        setReceivedMessage(JSON.parse(greeting.body).content);
      });
    });
    setStompClient(stompClient);
    return () => {
      if (stompClient !== null) {
        stompClient.disconnect();
      }
    };
  }, []);

  const sendMessage = () => {
    stompClient.send("/app/hello", {}, JSON.stringify({ name: name }));
  };

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={sendMessage}>Send</button>
      {receivedMessage && <div>Message: {receivedMessage}</div>}
    </div>
  );
}

export default App;
