from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
import os
from pathlib import Path
# Assuming VectorProductIndex and ProductInfo are correctly importable
# You might need to adjust the import path based on your project structure
from ..product_search import VectorProductIndex, ProductInfo # Adjusted import
from ..models import db, Product # Import the new Product model

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

# Helper function (consider moving to a utils file)
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Migrated from app.py ---
# Note: This needs integration with the new `Product` DB model
@products_bp.route('', methods=['POST'])
def add_product():
    """
    Adds a new product with image and details, storing info in DB and vector index.
    """
    try:
        if 'images' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        files = request.files.getlist('images')
        product_info_list = []
        added_products = []

        # Get product details from form data
        name = request.form.get('name')
        description = request.form.get('description', '')
        price_str = request.form.get('price')
        sku = request.form.get('sku') # Get SKU

        if not all([name, price_str, sku]):
             return jsonify({'error': 'Missing required fields: name, price, sku'}), 400

        try:
            price = float(price_str)
        except ValueError:
            return jsonify({'error': 'Invalid price format'}), 400

        # --- Database Integration ---
        # Check if SKU already exists
        existing_product = Product.query.filter_by(sku=sku).first()
        if existing_product:
            return jsonify({'error': f'SKU {sku} already exists'}), 409

        # Process the first image (assuming one image per product for now)
        file = files[0]
        if file and allowed_file(file.filename):
            filename = secure_filename(f"{sku}_{file.filename}") # Use SKU in filename
            upload_folder = current_app.config['UPLOAD_FOLDER']
            # Construct the relative path correctly based on UPLOAD_FOLDER
            # Example: if UPLOAD_FOLDER is /abs/path/to/data/product_search/images
            # We want image_path like 'product_search/images/sku_image.jpg'
            base_data_dir = Path(upload_folder).parent.parent # Assumes data/product_search/images structure
            relative_path = os.path.relpath(os.path.join(upload_folder, filename), base_data_dir)
            # Ensure OS-independent path separators
            relative_path = relative_path.replace(os.sep, '/')

            full_path = os.path.join(upload_folder, filename)
            # Ensure the target directory exists before saving
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            file.save(full_path)

            # Create Product entry in DB first
            new_product = Product(
                sku=sku,
                name=name,
                description=description,
                price=price,
                image_path=relative_path # Save relative path
            )
            db.session.add(new_product)
            db.session.commit() # Commit to get the new_product.id

            # --- Vector Index Integration ---
            # Use the DB product ID for the vector index
            product_id_for_vector = str(new_product.id)
            # Assume VectorProductIndex uses a simple ID, name, image_path structure for now
            product_info = ProductInfo(product_id=product_id_for_vector, name=name, image_path=full_path)
            product_info_list.append(product_info)
            added_products.append(new_product.to_dict()) # Add DB representation

        else:
             # Handle case where file is not allowed or not present correctly
             return jsonify({'error': 'Invalid or missing image file'}), 400

        # Add product info (vector) to the index
        product_index = current_app.config['PRODUCT_INDEX'] # Get index from app config
        product_index.add_products(product_info_list)

        # Save the updated index
        index_path = current_app.config['INDEX_PATH']
        product_index.save_index(index_path)

        # Prepare response with image URL
        response_data = new_product.to_dict()
        response_data['image_url'] = f"/api/images/{response_data['image_path']}"

        return jsonify({
            'message': f'Product {name} added successfully.',
            'product': response_data
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error adding product: {e}")
        db.session.rollback() # Rollback DB changes on error
        return jsonify({'error': 'Internal server error adding product'}), 500


# --- Existing search logic (needs modification) ---
@products_bp.route('/search', methods=['POST'])
def search_products():
    """
    Searches for products similar to an uploaded image or text query.
    Returns product details from the Database based on IDs found in the vector index.
    """
    search_type = request.form.get('type', 'image') # 'image' or 'text'
    num_results = int(request.form.get('num_results', 5))
    product_index = current_app.config['PRODUCT_INDEX']

    try:
        if search_type == 'image':
            if 'query_image' not in request.files:
                return jsonify({'error': 'No query image provided'}), 400
            file = request.files['query_image']
            if file and allowed_file(file.filename):
                 # Save temp file or process in memory if possible
                 # Ensure temp directory exists
                temp_dir = Path(current_app.config['UPLOAD_FOLDER']) / 'temp'
                temp_dir.mkdir(exist_ok=True)
                temp_path = temp_dir / f"temp_{secure_filename(file.filename)}"
                file.save(temp_path)
                results = product_index.search_by_image(str(temp_path), top_k=num_results)
                os.remove(temp_path) # Clean up temp file
            else:
                return jsonify({'error': 'Invalid query image file'}), 400
        elif search_type == 'text':
            query_text = request.form.get('query_text')
            if not query_text:
                return jsonify({'error': 'No query text provided'}), 400
            results = product_index.search_by_text(query_text, top_k=num_results)
        else:
            return jsonify({'error': 'Invalid search type'}), 400

        # --- Fetch details from Database ---
        if not results:
             return jsonify({'results': []}), 200

        # Ensure product IDs are integers for DB query
        product_ids = []
        for res in results:
            try:
                product_ids.append(int(res.product_id))
            except (ValueError, TypeError):
                current_app.logger.warning(f"Skipping invalid product ID from vector search: {res.product_id}")
                continue

        if not product_ids:
            return jsonify({'results': []}), 200

        # Query the database for products matching the IDs found
        matched_products = Product.query.filter(Product.id.in_(product_ids)).all()
        # Create a dictionary for quick lookup by ID
        products_dict = {p.id: p.to_dict() for p in matched_products}

        # Combine DB details with similarity scores
        final_results = []
        for res in results:
            try:
                 product_id = int(res.product_id)
            except (ValueError, TypeError):
                 continue # Skip if ID was invalid

            if product_id in products_dict:
                product_data = products_dict[product_id]
                product_data['similarity_score'] = res.score # Add score from vector search
                 # Ensure image path is converted to a URL accessible by the frontend
                product_data['image_url'] = f"/api/images/{product_data['image_path']}" # Example URL structure
                final_results.append(product_data)
            else:
                current_app.logger.warning(f"Product ID {product_id} found in vector index but not in database.")


        # Sort results based on original vector search score (highest first)
        final_results.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)

        return jsonify({'results': final_results}), 200

    except Exception as e:
        current_app.logger.error(f"Error searching products: {e}")
        # Clean up temp file in case of error during image search
        if search_type == 'image' and 'temp_path' in locals() and os.path.exists(temp_path):
             try:
                 os.remove(temp_path)
             except OSError as rm_err:
                 current_app.logger.error(f"Error removing temp file {temp_path}: {rm_err}")
        return jsonify({'error': 'Internal server error during search'}), 500


# --- Add endpoint to get a single product by ID ---
@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    product_data = product.to_dict()
    product_data['image_url'] = f"/api/images/{product_data['image_path']}" # Generate image URL
    return jsonify(product_data), 200

# --- Add endpoint to list all products (optional, consider pagination) ---
@products_bp.route('', methods=['GET'])
def list_products():
    # Basic pagination example
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Add sorting capabilities (example: sort by name or price)
    sort_by = request.args.get('sort_by', 'name') # Default sort by name
    sort_order = request.args.get('sort_order', 'asc') # Default ascending

    sort_column = getattr(Product, sort_by, Product.name) # Default to name if invalid
    if sort_order == 'desc':
        order = sort_column.desc()
    else:
        order = sort_column.asc()

    paginated_products = Product.query.order_by(order).paginate(page=page, per_page=per_page, error_out=False)

    products_data = []
    for product in paginated_products.items:
        product_dict = product.to_dict()
        product_dict['image_url'] = f"/api/images/{product_dict['image_path']}" # Generate image URL
        products_data.append(product_dict)

    return jsonify({
        'products': products_data,
        'total': paginated_products.total,
        'pages': paginated_products.pages,
        'current_page': page
    }), 200

# Note: The CSV upload endpoint ([add_products_from_csv](cci:1://file:///Users/richardzhang/github/image-search-engine/backend/app.py:206:0-334:46)) also needs to be migrated
# and updated to work with the Product DB model and potentially the vector index.
# This is left as a TODO for now.

# Note: The image serving endpoint ([serve_product_image_cn](cci:1://file:///Users/richardzhang/github/image-search-engine/backend/app.py:337:0-356:26) or similar)
# might need adjustment depending on how image paths are stored and accessed.
# A generic static file server for images referenced by their path might be simpler.
# See the proposed `/api/images/<path:subpath>` route in app.py modification.
