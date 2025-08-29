import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mail import Mail, Message
from supabase import create_client, Client
from dotenv import load_dotenv

# --- Load biến môi trường ---
load_dotenv()

# --- Khởi tạo app ---
app = Flask(__name__)
CORS(app)

# --- Kết nối Supabase ---
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
if not url or not key:
    raise ValueError("SUPABASE_URL và SUPABASE_KEY phải được cấu hình trong .env")

supabase: Client = create_client(url, key)

# --- Cấu hình Email ---
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')

mail = Mail(app)

# ==========================
#          API
# ==========================

@app.route('/')
def home():
    return "Backend server is running with Supabase!"

@app.route('/api/options', methods=['GET'])
def get_options():
    """Lấy các tùy chọn từ database"""
    try:
        aluminum_types = supabase.table('aluminum_types').select("id, name").execute().data
        handles = supabase.table('handle_types').select("id, name").execute().data
        glasses = supabase.table('glass_types').select("id, name").execute().data
        parts = supabase.table('part_types').select("id, name").execute().data

        return jsonify({
            "aluminums": aluminum_types,
            "handles": handles,
            "glasses": glasses,
            "parts": parts
        }), 200
    except Exception as e:
        print("Error fetching options:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/product-details', methods=['POST'])
def get_product_details():
    """Tìm sản phẩm theo tổ hợp 4 lựa chọn"""
    try:
        data = request.get_json()
        aluminum_id = data.get('aluminum_id')
        handle_id = data.get('handle_id')
        glass_id = data.get('glass_id')
        part_id = data.get('part_id')

        if not all([aluminum_id, handle_id, glass_id, part_id]):
            return jsonify({"error": "Thiếu một hoặc nhiều lựa chọn"}), 400

        product_id = f"{aluminum_id}{handle_id}{glass_id}{part_id}"

        response = supabase.table('product_details').select("*").eq('product_id', product_id).single().execute()

        if response.data:
            return jsonify(response.data), 200
        else:
            return jsonify({"error": "Không tìm thấy sản phẩm"}), 404

    except Exception as e:
        print("Error fetching product details:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/api/quotes', methods=['POST'])
def submit_quote():
    """Nhận báo giá từ frontend, lưu vào DB, tạo notification và gửi email"""
    try:
        data = request.get_json()

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

        if not all(quote_data.values()):
            return jsonify({"error": "Thiếu dữ liệu bắt buộc"}), 400

        # Lưu vào bảng quotes
        quote_response = supabase.table('quotes').insert(quote_data).execute()
        if not quote_response.data:
            return jsonify({"error": "Không thể lưu báo giá"}), 500

        quote_id = quote_response.data[0]["id"]

        # Tạo notification
        notification_message = f"Khách hàng {quote_data['customer_name']} vừa yêu cầu báo giá."
        supabase.table('notifications').insert({
            "message": notification_message,
            "quote_id": quote_id
        }).execute()

        # Gửi email HTML, lấy tên các loại sản phẩm từ Supabase
        try:
            from datetime import datetime
            def get_name(table, id):
                if not id or str(id).lower() == "none":
                    return "Không xác định"
                try:
                    res = supabase.table(table).select("name").eq("id", id).single().execute()
                    if res.data and "name" in res.data:
                        return res.data["name"]
                    else:
                        return "Không xác định"
                except Exception:
                    return "Không xác định"

            aluminum_name = get_name('aluminum_types', data.get('aluminum_id'))
            handle_name = get_name('handle_types', data.get('handle_id'))
            glass_name = get_name('glass_types', data.get('glass_id'))
            part_name = get_name('part_types', data.get('part_id'))

            time_sent = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
            body_html = f"""
                <h2>📢 <b>Yêu cầu báo giá mới</b></h2>
                <p><b>Thời gian gửi:</b> {time_sent}</p>
                <p><b>👤 Khách hàng:</b> {quote_data['customer_name']}</p>
                <p><b>📞 Số điện thoại:</b> {quote_data['customer_phone']}</p>
                <p><b>🛒 Sản phẩm:</b> {quote_data['product_id']}</p>
                <ul>
                    <li><b>Loại nhôm:</b> {aluminum_name}</li>
                    <li><b>Tay nắm:</b> {handle_name}</li>
                    <li><b>Kính:</b> {glass_name}</li>
                    <li><b>Bộ phận:</b> {part_name}</li>
                    <li><b>Kích thước:</b> {quote_data['actual_width']} x {quote_data['actual_height']} x {quote_data['actual_depth']}</li>
                    <li><b>Số lượng:</b> {quote_data['quantity']}</li>
                    <li><b>Thành tiền:</b> {quote_data['total_price']}</li>
                </ul>
                <p><b>📩 Trạng thái:</b> Đang chờ xử lý ✅</p>
            """
            msg = Message(
                subject="Yêu cầu báo giá mới",
                recipients=[os.getenv("SALE_EMAIL")],
                html=body_html
            )
            mail.send(msg)
        except Exception as e:
            print("Gửi email thất bại:", e)

        return jsonify({"message": "Đã lưu báo giá, tạo thông báo và gửi email!"}), 201

    except Exception as e:
        print("Error submitting quote:", e)
        return jsonify({"error": str(e)}), 500


# --- Run server ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
