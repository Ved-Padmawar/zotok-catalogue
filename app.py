from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import json
import hashlib
import hmac
import requests
import boto3
from datetime import datetime, timezone
from dotenv import load_dotenv
import urllib.parse
import base64
from urllib.parse import unquote

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS with more permissive settings for development
CORS(app, 
    resources={
        r"/*": {
            "origins": [
                "https://*.canva.com",
                "https://*.canva-apps.com", 
                "https://app-aagune4gw3o.canva-apps.com",  # Specific Canva app origin
                "https://*.devtunnels.ms",
                "https://localhost:8080",
                "http://localhost:8080",
                "https://127.0.0.1:8080",
                "http://127.0.0.1:8080"
            ],
            "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
            "allow_headers": [
                "Content-Type", 
                "Authorization", 
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
            ],
            "supports_credentials": True,
            "expose_headers": ["Content-Range", "X-Content-Range"],
            "max_age": 3600
        }
    }
)

# Token expiry constants
TOKEN_EXPIRY_SECONDS = 28 * 24 * 60 * 60  # 28 days in seconds (2,419,200)

# Add explicit CORS headers to all responses
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    
    # List of allowed origins
    allowed_origins = [
        'https://app-aagune4gw3o.canva-apps.com',
        'https://localhost:8080',
        'http://localhost:8080'
    ]
    
    # Check if origin ends with allowed domains
    allowed_domains = ['.canva.com', '.canva-apps.com', '.devtunnels.ms']
    
    if origin:
        if origin in allowed_origins or any(origin.endswith(domain) for domain in allowed_domains):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    response.headers['Access-Control-Max-Age'] = '3600'
    
    return response

# Handle preflight OPTIONS requests explicitly
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'OK'})
        origin = request.headers.get('Origin')
        
        allowed_origins = [
            'https://app-aagune4gw3o.canva-apps.com',
            'https://localhost:8080',
            'http://localhost:8080'
        ]
        
        allowed_domains = ['.canva.com', '.canva-apps.com', '.devtunnels.ms']
        
        if origin:
            if origin in allowed_origins or any(origin.endswith(domain) for domain in allowed_domains):
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Max-Age'] = '3600'
        
        return response

# Configuration
class Config:
    AWS_ACCESS_KEY_ID = os.getenv('ZOTOK_AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('ZOTOK_AWS_SECRET_ACCESS_KEY')
    AWS_REGION = os.getenv('ZOTOK_AWS_REGION', 'us-east-1')
    S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'zotok-developer-apps')
    ZOTOK_API_BASE_URL = os.getenv('ZOTOK_API_BASE_URL', 'https://api-qa.zono.digital')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000) or 5000)
    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')

# Initialize S3 client
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
        region_name=Config.AWS_REGION
    )
except Exception as e:
    print(f"Warning: S3 client initialization failed: {e}")
    s3_client = None

def create_hmac_signature(workspace_id, client_id, client_secret):
    """Create HMAC signature for Zotok authentication"""
    message = f"{workspace_id}_{client_id}"
    signature = hmac.new(
        client_secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

def store_user_credentials(canva_user_id, workspace_id, client_id, client_secret, login_token, expires_in=TOKEN_EXPIRY_SECONDS):
    """Store user credentials and token in S3 with 28-day expiry"""
    if not s3_client:
        print("S3 client not available")
        return False
        
    try:
        user_data = {
            "canva_user_id": canva_user_id,
            "workspace_id": workspace_id,
            "client_id": client_id,
            "client_secret": client_secret,
            "login_token": login_token,
            "token_timestamp": datetime.now(timezone.utc).isoformat(),
            "token_expires_in": expires_in  # Now defaults to 28 days
        }
        
        filename = f"canva-catalog-app/{canva_user_id}.json"
        s3_client.put_object(
            Bucket=Config.S3_BUCKET_NAME,
            Key=filename,
            Body=json.dumps(user_data),
            ContentType='application/json'
        )
        print(f"Stored credentials for user {canva_user_id} with {expires_in} seconds expiry ({expires_in / (24 * 60 * 60):.1f} days)")
        return True
    except Exception as e:
        print(f"Error storing credentials: {e}")
        return False

def get_user_credentials(canva_user_id):
    """Retrieve user credentials from S3"""
    if not s3_client:
        return None
        
    try:
        filename = f"canva-catalog-app/{canva_user_id}.json"
        response = s3_client.get_object(Bucket=Config.S3_BUCKET_NAME, Key=filename)
        user_data = json.loads(response['Body'].read())
        return user_data
    except Exception as e:
        print(f"Error retrieving credentials: {e}")
        return None

def update_user_credentials(canva_user_id, updated_data):
    """Update user credentials in S3"""
    if not s3_client:
        print("S3 client not available")
        return False
        
    try:
        filename = f"canva-catalog-app/{canva_user_id}.json"
        s3_client.put_object(
            Bucket=Config.S3_BUCKET_NAME,
            Key=filename,
            Body=json.dumps(updated_data),
            ContentType='application/json'
        )
        print(f"Updated credentials for user {canva_user_id}")
        return True
    except Exception as e:
        print(f"Error updating credentials: {e}")
        return False

def is_token_valid(user_data):
    """Check if stored token is still valid (28-day expiry)"""
    try:
        token_timestamp = datetime.fromisoformat(user_data['token_timestamp'].replace('Z', '+00:00'))
        expires_in = user_data.get('token_expires_in', TOKEN_EXPIRY_SECONDS)  # Default to 28 days instead of 1 hour
        now = datetime.now(timezone.utc)
        
        token_age = (now - token_timestamp).total_seconds()
        is_valid = token_age < expires_in
        
        # Log token status for debugging
        days_remaining = (expires_in - token_age) / (24 * 60 * 60)
        print(f"Token validity check: age={token_age:.0f}s, expires_in={expires_in}s, valid={is_valid}, days_remaining={days_remaining:.1f}")
        
        return is_valid
    except Exception as e:
        print(f"Error checking token validity: {e}")
        return False

def is_valid_image_url(url):
    """Validate if URL is a legitimate image URL"""
    try:
        parsed = urllib.parse.urlparse(url)
        if not parsed.scheme in ['http', 'https']:
            return False
        if not parsed.netloc:
            return False
        
        # Check for common image file extensions
        path = parsed.path.lower()
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
        
        # Allow if it has image extension OR if it's from trusted domains
        has_image_ext = any(path.endswith(ext) for ext in image_extensions)
        trusted_domains = ['api-qa.zono.digital', 'images-qa.zono.digital', 'images.unsplash.com', 'cdn.shopify.com', 'example.com']
        is_trusted = any(domain in parsed.netloc for domain in trusted_domains)
        
        return has_image_ext or is_trusted
    except Exception:
        return False

# =============================================================================
# CORS PROXY ENDPOINTS FOR IMAGES (SIMPLIFIED - NO OPTIMIZATION)
# =============================================================================

@app.route("/proxy/image")
def proxy_image():
    image_url = request.args.get("url")
    if not image_url:
        return jsonify({"error": "Missing image URL"}), 400

    try:
        # Decode URL in case it was encoded multiple times
        image_url = unquote(image_url)
        print(f"[Proxy] Fetching image from: {image_url}")

        # Optional: Add auth header if required by the third-party service
        headers = {
            "User-Agent": "Mozilla/5.0",
            # "Authorization": "Bearer your_token_if_needed"  # Uncomment and use if required
        }

        # Fetch the actual image
        resp = requests.get(image_url, headers=headers, stream=True, timeout=10)
        resp.raise_for_status()

        # Get or default the content type
        content_type = resp.headers.get("Content-Type", "image/jpeg")
        print(f"[Proxy] Content-Type: {content_type}")

        return Response(
            resp.raw,
            headers={
                "Content-Type": content_type,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=3600"
            },
            status=resp.status_code
        )

    except requests.exceptions.RequestException as e:
        print(f"[Proxy Error] Failed to fetch image: {str(e)}")
        return jsonify({"error": f"Image fetch failed: {str(e)}"}), 400

@app.route('/proxy/image/base64', methods=['POST'])
def proxy_image_base64():
    """
    Convert image URL to base64 data URL for embedding (simplified version)
    Usage: POST /proxy/image/base64 with JSON body: {"url": "https://example.com/image.jpg"}
    """
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing url in request body'
            }), 400
        
        image_url = data['url']
        
        # Validate URL
        if not is_valid_image_url(image_url):
            return jsonify({
                'success': False,
                'error': 'Invalid or unsafe image URL'
            }), 400
        
        # Fetch the image
        headers = {
            'User-Agent': 'ZotokCanvaApp/1.0',
            'Accept': 'image/*',
        }
        
        response = requests.get(image_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': f'Failed to fetch image: HTTP {response.status_code}'
            }), 404
        
        # Get image data and content type
        image_data = response.content
        content_type = response.headers.get('content-type', 'image/jpeg')
        
        # Convert to base64
        base64_data = base64.b64encode(image_data).decode('utf-8')
        data_url = f"data:{content_type};base64,{base64_data}"
        
        return jsonify({
            'success': True,
            'data_url': data_url,
            'content_type': content_type,
            'size': len(image_data)
        })
        
    except requests.RequestException as e:
        return jsonify({
            'success': False,
            'error': f'Network error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Base64 conversion error: {str(e)}'
        }), 500

# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

@app.route('/auth/login', methods=['POST'])
def login():
    """Handle authentication with Zotok API with 28-day token expiry"""
    try:
        data = request.get_json()
        
        # Extract credentials
        workspace_id = data.get('workspaceId')
        client_id = data.get('clientId')
        client_secret = data.get('clientSecret')
        canva_user_id = data.get('canvaUserId')  # From Canva SDK
        
        if not all([workspace_id, client_id, client_secret, canva_user_id]):
            return jsonify({
                'success': False,
                'error': 'Missing required credentials'
            }), 400
        
        # Create HMAC signature
        signature = create_hmac_signature(workspace_id, client_id, client_secret)
        
        # Call Zotok authentication API
        auth_payload = {
            "workspaceId": workspace_id,
            "clientId": client_id,
            "signature": signature
        }
        
        auth_response = requests.post(
            f"{Config.ZOTOK_API_BASE_URL}/mdm-integration/v1/api/auth/login",
            headers={'Content-Type': 'application/json'},
            json=auth_payload,
            timeout=30
        )
        
        print(f"Zotok API Response Status: {auth_response.status_code}")
        print(f"Zotok API Response Body: {auth_response.text}")
        
        # Accept 200, 201, 202 status codes as successful
        if auth_response.status_code not in [200, 201, 202]:
            return jsonify({
                'success': False,
                'error': 'Authentication failed with Zotok API',
                'details': auth_response.text,
                'status_code': auth_response.status_code
            }), 401
        
        try:
            auth_data = auth_response.json()
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON response from Zotok API',
                'details': auth_response.text
            }), 401
            
        login_token = auth_data.get('token') or auth_data.get('access_token')
        
        if not login_token:
            return jsonify({
                'success': False,
                'error': 'No token received from Zotok API'
            }), 401
        
        # Store credentials in S3 with 28-day expiry
        if store_user_credentials(canva_user_id, workspace_id, client_id, client_secret, login_token, TOKEN_EXPIRY_SECONDS):
            return jsonify({
                'success': True,
                'token': login_token,
                'expires_in': TOKEN_EXPIRY_SECONDS,
                'expires_in_days': TOKEN_EXPIRY_SECONDS / (24 * 60 * 60),
                'message': 'Authentication successful - token valid for 28 days'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to store credentials'
            }), 500
            
    except requests.RequestException as e:
        return jsonify({
            'success': False,
            'error': 'Network error during authentication',
            'details': str(e)
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500

@app.route('/auth/token', methods=['GET'])
def get_token():
    """Get stored token for user if valid (28-day expiry)"""
    try:
        canva_user_id = request.args.get('canvaUserId')
        
        if not canva_user_id:
            return jsonify({
                'success': False,
                'error': 'Missing canvaUserId parameter'
            }), 400
        
        user_data = get_user_credentials(canva_user_id)
        
        if not user_data:
            return jsonify({
                'success': False,
                'error': 'No stored credentials found'
            }), 404
        
        if is_token_valid(user_data):
            # Calculate remaining time
            token_timestamp = datetime.fromisoformat(user_data['token_timestamp'].replace('Z', '+00:00'))
            expires_in = user_data.get('token_expires_in', TOKEN_EXPIRY_SECONDS)
            now = datetime.now(timezone.utc)
            token_age = (now - token_timestamp).total_seconds()
            remaining_seconds = expires_in - token_age
            remaining_days = remaining_seconds / (24 * 60 * 60)
            
            return jsonify({
                'success': True,
                'token': user_data['login_token'],
                'remaining_seconds': int(remaining_seconds),
                'remaining_days': round(remaining_days, 1),
                'message': f'Valid token retrieved - {remaining_days:.1f} days remaining'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Stored token has expired'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Error retrieving token',
            'details': str(e)
        }), 500

@app.route('/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh token using stored credentials with 28-day expiry"""
    try:
        data = request.get_json()
        canva_user_id = data.get('canvaUserId')
        
        if not canva_user_id:
            return jsonify({
                'success': False,
                'error': 'Missing canvaUserId'
            }), 400
        
        user_data = get_user_credentials(canva_user_id)
        
        if not user_data:
            return jsonify({
                'success': False,
                'error': 'No stored credentials found'
            }), 404
        
        # Use stored credentials to get new token
        workspace_id = user_data['workspace_id']
        client_id = user_data['client_id']
        client_secret = user_data['client_secret']
        
        signature = create_hmac_signature(workspace_id, client_id, client_secret)
        
        auth_payload = {
            "workspaceId": workspace_id,
            "clientId": client_id,
            "signature": signature
        }
        
        auth_response = requests.post(
            f"{Config.ZOTOK_API_BASE_URL}/mdm-integration/v1/api/auth/login",
            headers={'Content-Type': 'application/json'},
            json=auth_payload,
            timeout=30
        )
        
        print(f"Token Refresh - Zotok API Status: {auth_response.status_code}")
        print(f"Token Refresh - Zotok API Body: {auth_response.text}")
        
        # Accept 200, 201, 202 status codes as successful
        if auth_response.status_code not in [200, 201, 202]:
            return jsonify({
                'success': False,
                'error': 'Token refresh failed',
                'details': auth_response.text,
                'status_code': auth_response.status_code
            }), 401
        
        try:
            auth_data = auth_response.json()
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': 'Invalid JSON response from Zotok API during refresh',
                'details': auth_response.text
            }), 401
            
        new_token = auth_data.get('token') or auth_data.get('access_token')
        
        if not new_token:
            return jsonify({
                'success': False,
                'error': 'No token received during refresh'
            }), 401
        
        # Update stored token with 28-day expiry
        if store_user_credentials(canva_user_id, workspace_id, client_id, client_secret, new_token, TOKEN_EXPIRY_SECONDS):
            return jsonify({
                'success': True,
                'token': new_token,
                'expires_in': TOKEN_EXPIRY_SECONDS,
                'expires_in_days': TOKEN_EXPIRY_SECONDS / (24 * 60 * 60),
                'message': 'Token refreshed successfully - valid for 28 days'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to store refreshed token'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Error refreshing token',
            'details': str(e)
        }), 500

# =============================================================================
# USER SETTINGS ENDPOINT - NEW
# =============================================================================

@app.route('/api/user/settings', methods=['GET', 'POST'])
def user_settings():
    """Handle user phone number settings"""
    try:
        if request.method == 'GET':
            # Get user phone number
            canva_user_id = request.args.get('canvaUserId')
            
            if not canva_user_id:
                return jsonify({
                    'success': False,
                    'error': 'Missing canvaUserId parameter'
                }), 400
            
            # Get auth token from header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({
                    'success': False,
                    'error': 'Authorization header missing'
                }), 401
            
            # Retrieve user data from S3 using existing function
            user_data = get_user_credentials(canva_user_id)
            
            if not user_data:
                return jsonify({
                    'success': False,
                    'error': 'User data not found'
                }), 404
            
            # Check if token is still valid using existing function
            if not is_token_valid(user_data):
                return jsonify({
                    'success': False,
                    'error': 'Token expired'
                }), 401
            
            # Return phone number if it exists
            phone_number = user_data.get('phoneNumber', '')
            
            return jsonify({
                'success': True,
                'phoneNumber': phone_number
            })
            
        elif request.method == 'POST':
            # Save user phone number
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'No data provided'
                }), 400
            
            canva_user_id = data.get('canvaUserId')
            phone_number = data.get('phoneNumber', '').strip()
            
            if not canva_user_id:
                return jsonify({
                    'success': False,
                    'error': 'Missing canvaUserId'
                }), 400
            
            if not phone_number:
                return jsonify({
                    'success': False,
                    'error': 'Phone number is required'
                }), 400
            
            # Get auth token from header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({
                    'success': False,
                    'error': 'Authorization header missing'
                }), 401
            
            # Retrieve existing user data from S3 using existing function
            user_data = get_user_credentials(canva_user_id)
            
            if not user_data:
                return jsonify({
                    'success': False,
                    'error': 'User data not found'
                }), 404
            
            # Check if token is still valid using existing function
            if not is_token_valid(user_data):
                return jsonify({
                    'success': False,
                    'error': 'Token expired'
                }), 401
            
            # Update user data with phone number (this will overwrite any existing phone number)
            user_data['phoneNumber'] = phone_number
            user_data['settings_updated'] = datetime.now(timezone.utc).isoformat()
            
            # Save updated data back to S3 using existing function
            if update_user_credentials(canva_user_id, user_data):
                print(f"Updated phone number for user {canva_user_id}: {phone_number}")
                
                return jsonify({
                    'success': True,
                    'message': 'Settings saved successfully',
                    'phoneNumber': phone_number
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to save settings to storage'
                }), 500
                
    except Exception as e:
        print(f"Error in user_settings endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500

# =============================================================================
# ZOTOK API PROXY ENDPOINTS
# =============================================================================

@app.route('/api/products', methods=['GET'])
def proxy_products():
    """Proxy products request to Zotok API"""
    try:
        # Get auth token from request header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Authorization header missing'
            }), 401
        
        # Get query parameters
        page = request.args.get('page', '1')
        limit = request.args.get('limit', '20')
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        
        # Build query parameters for Zotok API
        params = {
            'page': page,
            'limit': limit
        }
        if search:
            params['search'] = search
        if category:
            params['category'] = category
        
        # Make request to Zotok API
        zotok_url = f"{Config.ZOTOK_API_BASE_URL}/hub/mdm-integration/v1/api/products"
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json'
        }
        
        print(f"Proxying request to: {zotok_url}")
        print(f"With params: {params}")
        print(f"With headers: Authorization: {auth_header[:20]}...")
        
        response = requests.get(
            zotok_url,
            headers=headers,
            params=params,
            timeout=30
        )
        
        print(f"Zotok API Response Status: {response.status_code}")
        print(f"Zotok API Response Body: {response.text[:500]}...")  # First 500 chars
        
        # Return the response from Zotok API
        try:
            response_data = response.json()
            
            # Ensure response_data is an array
            if isinstance(response_data, list):
                products_array = response_data
            elif isinstance(response_data, dict) and 'products' in response_data:
                products_array = response_data['products']
            elif isinstance(response_data, dict) and 'data' in response_data:
                products_array = response_data['data']
            else:
                products_array = []
            
            # NO IMAGE PROCESSING - Just pass through original URLs
            # Images are already publicly accessible from Zotok
            
            print(f"Processed products array length: {len(products_array)}")
            
            return jsonify({
                'success': True,
                'data': {
                    'products': products_array,
                    'page': int(page),
                    'limit': int(limit),
                    'total': len(products_array)
                }
            }), 200
        except ValueError:
            # If response is not JSON
            return jsonify({
                'success': False,
                'error': 'Invalid response from Zotok API',
                'details': response.text
            }), 500
            
    except requests.RequestException as e:
        print(f"Error proxying to Zotok API: {e}")
        return jsonify({
            'success': False,
            'error': 'Network error connecting to Zotok API',
            'details': str(e)
        }), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@app.route('/api/products/<product_id>', methods=['GET'])
def proxy_product_detail(product_id):
    """Proxy single product request to Zotok API"""
    try:
        # Get auth token from request header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Authorization header missing'
            }), 401
        
        # Make request to Zotok API
        zotok_url = f"{Config.ZOTOK_API_BASE_URL}/hub/mdm-integration/v1/api/products/{product_id}"
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            zotok_url,
            headers=headers,
            timeout=30
        )
        
        # Return the response from Zotok API
        if response.status_code == 200:
            product_data = response.json()
            
            # NO IMAGE PROCESSING - Just pass through original URLs
            # Images are already publicly accessible from Zotok
            
            return jsonify({
                'success': True,
                'data': product_data
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Product not found or API error: {response.status_code}',
                'details': response.text
            }), response.status_code
            
    except requests.RequestException as e:
        return jsonify({
            'success': False,
            'error': 'Network error connecting to Zotok API',
            'details': str(e)
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500
@app.route('/api/test-zotok', methods=['GET'])
def test_zotok_connection():
    """Test endpoint to verify Zotok API connectivity"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Authorization header missing'
            }), 401
            
        # Test call to Zotok API
        zotok_url = f"{Config.ZOTOK_API_BASE_URL}/hub/mdm-integration/v1/api/products"
        headers = {
            'Authorization': auth_header,
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            zotok_url,
            headers=headers,
            params={'limit': 1},  # Just get 1 product for testing
            timeout=10
        )
        
        return jsonify({
            'success': True,
            'status_code': response.status_code,
            'response_size': len(response.text),
            'content_type': response.headers.get('content-type'),
            'message': 'Connection to Zotok API successful'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to connect to Zotok API',
            'details': str(e)
        }), 500

# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Zotok Canva Auth Service',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'cors_test': 'enabled',
        'proxy_enabled': True,
        'settings_endpoint': True,
        'token_expiry_days': TOKEN_EXPIRY_SECONDS / (24 * 60 * 60)
    })

# Test endpoint for CORS
@app.route('/test-cors', methods=['GET', 'POST', 'OPTIONS'])
def test_cors():
    """Test CORS configuration"""
    return jsonify({
        'status': 'CORS working',
        'method': request.method,
        'origin': request.headers.get('Origin'),
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print(f"Starting Zotok Auth Service on {Config.FLASK_HOST}:{Config.FLASK_PORT}")
    print(f"S3 Bucket: {Config.S3_BUCKET_NAME} (storing in canva-catalog-app/ folder)")
    print(f"Zotok API: {Config.ZOTOK_API_BASE_URL}")
    print(f"Token Expiry: {TOKEN_EXPIRY_SECONDS} seconds ({TOKEN_EXPIRY_SECONDS / (24 * 60 * 60)} days)")
    print(f"CORS enabled for Canva apps")
    print("Available endpoints:")
    print("  Authentication:")
    print("    POST /auth/login")
    print("    GET  /auth/token")
    print("    POST /auth/refresh")
    print("  User Settings:")
    print("    GET  /api/user/settings")
    print("    POST /api/user/settings")
    print("  Zotok API Proxy:")
    print("    GET  /api/products")
    print("    GET  /api/products/<id>")
    print("    GET  /api/test-zotok")
    print("  CORS Image Proxy:")
    print("    GET  /proxy/image?url=<image_url>")
    print("    POST /proxy/image/base64")
    print("  Utilities:")
    print("    GET  /health")
    print("    GET  /test-cors")
    
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    )