from flask import Flask, request, jsonify
from fetch_order_details import fetch_order_details  # Import your script function

app = Flask(__name__)

@app.route('/order', methods=['POST'])
def get_order_details():
    data = request.json
    order_id = data.get('order_id')
    machine_id = data.get('machine_id')

    if not order_id or not machine_id:
        return jsonify({"error": "Missing order_id or machine_id"}), 400

    order_details = fetch_order_details(order_id, machine_id)

    if order_details:
        return jsonify(order_details)
    else:
        return jsonify({"error": "Failed to retrieve order details"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
