import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // Đảm bảo CSS được đóng gói cùng

// Hàm này sẽ được gọi khi file script được tải trên web khác
const initChatbot = () => {
  // 1. Tạo một thẻ div riêng cho chatbot
  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'bao-gia-chatbot-container';
  document.body.appendChild(chatbotContainer);

  // 2. Render ứng dụng React của bạn vào trong thẻ div đó
  const root = createRoot(chatbotContainer);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// 3. Chạy hàm khởi tạo ngay lập tức
initChatbot();