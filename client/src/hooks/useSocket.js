
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth/AuthContext.jsx";

export function useSocket(roomId) {
  const { token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !roomId) {
      setSocket(null);
      setMessages([]);
      return;
    }

    const s = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001",
      {
        auth: { token },
      }
    );

    setSocket(s);
    setMessages([]);

    const onMessage = (message) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        message,
      ]);
    };

    const onConnectError = (error) => {
      console.error("Socket connection failed:", error.message);
    };

    s.on("connect", () => {
      s.emit("room:join", roomId);
    });

    s.on("chat:message", onMessage);
    s.on("connect_error", onConnectError);

    return () => {
      s.off("chat:message", onMessage);
      s.off("connect_error", onConnectError);
      s.disconnect();
    };
  }, [token, roomId]);

  const sendMessage = useCallback(
    (text) => {
      if (typeof text !== "string" || !text.trim()) return;

      socket?.emit("chat:message", {
        roomId,
        text: text.trim(),
      });
    },
    [socket, roomId]
  );

  return { messages, sendMessage };
}
