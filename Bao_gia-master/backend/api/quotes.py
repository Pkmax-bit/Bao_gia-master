@app.route('/api/quotes', methods=['POST'])
def submit_quote():
    """
    API để nhận thông tin báo giá từ frontend, lưu vào bảng 'quotes', 
    và tạo một thông báo mới trong bảng 'notifications',
    đồng thời gửi email cho SALE_EMAIL.
    """
    try:
        data = request.get_json()
        
        # Dữ liệu cần thiết để lưu vào bảng 'quotes'
        quote_data = {
            'customer_name': data.get('customerName'),
            'customer_phone': data.get('customerPhone'),
            'product_id': data.get('productId'),
            'actual_width': data.get('actualWidth'),
            'actual_height': data.get('actualHeight'),
            'actual_depth': data.get('actualDepth'),
            'quantity': data.get('quantity'),
            'total_price': data.get('totalPrice')
        }

        # Kiểm tra dữ liệu bắt buộc
        if not all(quote_data.values()):
            return jsonify({"error": "Missing required fields in quote data"}), 400

        # Insert vào bảng 'quotes' và trả về bản ghi vừa tạo
        quote_response = supabase.table('quotes').insert(
            quote_data, returning="representation"
        ).execute()

        if not quote_response.data:
            return jsonify({"error": "Failed to save quote"}), 500

        new_quote_id = quote_response.data[0]['id']

        # Tạo thông báo mới cho admin
        notification_message = (
            f"Khách hàng {data.get('customerName')} ({data.get('customerPhone')}) "
            f"vừa yêu cầu báo giá cho sản phẩm {data.get('productId')}."
        )
        
        notification_data = {
            'message': notification_message,
            'quote_id': new_quote_id
        }
        supabase.table('notifications').insert(notification_data).execute()

        # --- GỬI EMAIL ---
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            sender_email = os.getenv("MAIL_USERNAME")
            sender_password = os.getenv("MAIL_PASSWORD")
            receiver_email = os.getenv("SALE_EMAIL")

            subject = "Yêu cầu báo giá mới"
            body = (
                f"{notification_message}\n\n"
                f"Chi tiết:\n"
                f"- Kích thước: {data.get('actualWidth')} x {data.get('actualHeight')} x {data.get('actualDepth')}\n"
                f"- Số lượng: {data.get('quantity')}\n"
                f"- Thành tiền: {data.get('totalPrice')}"
            )

            msg = MIMEMultipart()
            msg["From"] = sender_email
            msg["To"] = receiver_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print("Gửi email thất bại:", e)

        return jsonify({"message": "Quote submitted successfully!"}), 201
    except Exception as e:
        print(f"Error submitting quote: {e}")
        return jsonify({"error": str(e)}), 500
