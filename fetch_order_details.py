import requests
import logging
from requests.exceptions import RequestException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_order_details(order_id, machine_id):
    """
    Fetch order details from the API.
    
    Args:
        order_id (str): The order ID to fetch
        machine_id (str): The machine ID associated with the order
    
    Returns:
        dict: Order details if successful, None if failed
    """
    api_url = f"https://www.sttark.com/api/orders/specs/{order_id}/{machine_id}"
    
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'OrderDetailsClient/1.0'
    }

    try:
        logger.info(f"Fetching order details for Order ID: {order_id}, Machine ID: {machine_id}")
        logger.info(f"Making request to: {api_url}")
        
        # Disable SSL verification for testing
        response = requests.get(
            api_url, 
            headers=headers, 
            timeout=10,
            verify=False  # Warning: Only for testing/debugging
        )
        
        # Suppress only the InsecureRequestWarning from urllib3
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        response.raise_for_status()  # Raise an exception for bad status codes
        
        data = response.json()
        logger.info("Successfully retrieved order details")
        return data

    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP Error: {e}")
        if response.status_code == 404:
            return {"error": "Order not found"}
        elif response.status_code == 401:
            return {"error": "Unauthorized access"}
        else:
            return {"error": f"HTTP Error: {response.status_code}"}
            
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection Error: Failed to connect to the API server - {str(e)}")
        return {"error": f"Failed to connect to the server: {str(e)}"}
        
    except requests.exceptions.Timeout:
        logger.error("Timeout Error: Request timed out")
        return {"error": "Request timed out"}
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request Error: {e}")
        return {"error": "An unexpected error occurred"}
        
    except ValueError as e:
        logger.error(f"JSON Parsing Error: {e}")
        return {"error": "Invalid response from server"}

if __name__ == "__main__":
    # Test the function with sample values
    test_order_id = "733236"  # Correct job number format
    test_machine_id = "229"   # Fixed machine ID
    result = fetch_order_details(test_order_id, test_machine_id)
    print("Test Result:", result)
