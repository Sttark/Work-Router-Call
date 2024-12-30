import requests

def fetch_order_details(order_id, machine_id):
    api_url = f"https://www.sttark.com/api/orders/specs/{order_id}/{machine_id}"
    response = requests.get(api_url, headers={'Accept': 'application/json'})

    if response.status_code == 200:
        data = response.json()
        print("Order Details:")
        print(data)
        return data
    else:
        print(f"Failed to retrieve data: {response.status_code}")
        return None

def test_fetch_order_details():
    # Replace these with test values
    test_order_id = "733236"  # Example order ID
    test_machine_id = "227"  # Replace with your machine ID

    result = fetch_order_details(test_order_id, test_machine_id)
    if result:
        print("Test Passed: Order details retrieved successfully.")
    else:
        print("Test Failed: Could not retrieve order details.")

if __name__ == "__main__":
    test_fetch_order_details()