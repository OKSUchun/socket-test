import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

function App() {
  const [stompClient, setStompClient] = useState(null);
  const [receivedMessage, setReceivedMessage] = useState(null);
  const [roomId, setRoomId] = useState(1); // Room ID
  const [memberId, setMemberId] = useState(2); // Member ID
  const [chatMessage, setChatMessage] = useState(""); // State for chat message input
  const [chats, setChats] = useState([]); // 과거 채팅 내역
  const [cursorId, setCursorId] = useState(null); // 페이지네이션을 위한 커서 ID
  const [size, setSize] = useState(20); // 한 번에 불러올 채팅 메시지의 개수
  const [response, setResponse] = useState(null);
  const [hasMoreChats, setHasMoreChats] = useState(true); // 초기에는 더 많은 채팅이 있다고 가정

  const fetchChats = async () => {
    const oldestChatId = chats.length > 0 ? chats[0].chatId : null;
    try {
      const response = oldestChatId === null
        ? await fetch(`http://localhost:8081/rooms/${roomId}/chats?size=${size}`)
        : await fetch(`http://localhost:8081/rooms/${roomId}/chats?cursorId=${oldestChatId}&size=${size}`);

      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }

      const data = await response.json();

      // 데이터를 chatId 기준으로 오름차순 정렬
      const sortedData = [...data.values].sort((a, b) => a.chatId - b.chatId);

      // 중복 제거 (고유한 chatId만 유지)
      const uniqueSortedData = sortedData.filter((chat, index, self) =>
        index === self.findIndex((t) => (
          t.chatId === chat.chatId
        ))
      );

      setChats(prevChats => [...uniqueSortedData, ...prevChats].sort((a, b) => a.chatId - b.chatId));
      setHasMoreChats(data.hasNext); // `hasNext` 값에 따라 state 업데이트
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
    console.log("fetchChats 끝");
  };

  useEffect(() => {
    // const socket = new SockJS("http://localhost:8081/ws");
    const socket = new SockJS("http://15.164.104.128:8081/ws");
    const stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
      stompClient.subscribe(`/topic/rooms/${roomId}`, function (greeting) {
        setReceivedMessage(JSON.parse(greeting.body).content); // Update message content
      });
      stompClient.subscribe(`/topic/rooms/${roomId}/chat`, function (message) {
        const newMessage = JSON.parse(message.body);
        // 새 메시지를 chats 배열에 추가
        setChats(prevChats => [newMessage, ...prevChats]);
      });
    });
    setStompClient(stompClient);
    return () => {
      if (stompClient !== null) {
        stompClient.disconnect();
      }
    };
  }, [roomId]); // Re-run useEffect when roomId changes.

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) { // 페이지의 상단에 도달했는지 확인
        fetchChats(); // 추가 채팅 내역 불러오기
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [fetchChats]); // fetchChats 함수가 변경될 때마다 이벤트 리스너 업데이트


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
      <div>
        <button onClick={fetchChats} disabled={!hasMoreChats}>과거 메시지 불러오기</button>
        {chats.map((chat) => (
          <div key={chat.chatId}>
            <p>{chat.writerName}: {chat.content || '내용 없음'}</p>
            <p>{chat.regDatetime ? new Date(chat.regDatetime).toLocaleString() : '날짜 정보 없음'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
