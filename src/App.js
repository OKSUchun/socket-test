import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

function App() {
  const [stompClient, setStompClient] = useState(null);
  const [name, setName] = useState("");
  const [receivedMessage, setReceivedMessage] = useState(null);
  const [roomId, setRoomId] = useState(1); // 추가된 부분: 방 ID 설정
  const [memberId, setMemberId] = useState(2);

  useEffect(() => {
    // const socket = new SockJS("http://localhost:8081/ws");
    const socket = new SockJS("http://15.164.104.128:8081/ws");
    const stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
      console.log("Connected: " + frame);
      // 방 ID에 따라 메시지 구독 경로를 변경
      stompClient.subscribe(`/topic/rooms/${roomId}`, function (greeting) {
        console.log(greeting.body);
        setReceivedMessage(JSON.parse(greeting.body).content); // 메시지 내용 업데이트
      });
    });
    setStompClient(stompClient);
    return () => {
      if (stompClient !== null) {
        stompClient.disconnect();
      }
    };
  }, [roomId]); // roomId가 변경될 때마다 useEffect가 다시 실행됩니다.

  const sendMessage = () => {
    // 방 ID와 사용자 이름을 포함한 메시지를 전송합니다.
    stompClient.send(`/app/rooms/${roomId}/${memberId}`, {});
  };

  return (
    <div>
      <input
        type="text"
        value={memberId}
        onChange={(e) => setMemberId(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={sendMessage}>Send</button>
      {receivedMessage && <div>Message: {receivedMessage}</div>}
    </div>
  );
}

export default App;
