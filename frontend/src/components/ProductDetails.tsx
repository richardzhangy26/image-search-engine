import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

// Mock product data - in a real app, this would come from an API
const mockProducts = {
  '1': {
    id: '1',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    name: "Smart Watch Pro",
    category: "Electronics",
    price: 299.99,
    description: "Premium smartwatch with heart rate monitoring, GPS tracking, and a beautiful OLED display. Perfect for fitness enthusiasts and tech lovers alike.",
    features: [
      "Heart rate monitoring",
      "GPS tracking",
      "OLED display",
      "Water resistant",
      "5-day battery life"
    ],
    specs: {
      "Display": "1.4\" OLED",
      "Battery": "410mAh",
      "Water Resistance": "5ATM",
      "Connectivity": "Bluetooth 5.0, WiFi",
      "Compatibility": "iOS 12+, Android 8+"
    }
  },
  '2': {
    id: '2',
    url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
    name: "Digital Watch X",
    category: "Electronics",
    price: 199.99,
    description: "Modern digital watch with advanced features including water resistance up to 50m, stopwatch, and multiple time zones.",
    features: [
      "Multiple time zones",
      "Stopwatch",
      "50m water resistance",
      "LED backlight",
      "2-year battery life"
    ],
    specs: {
      "Display": "LCD",
      "Battery": "CR2032",
      "Water Resistance": "50m",
      "Case Material": "Stainless Steel",
      "Band": "Silicone"
    }
  },
  '3': {
    id: '3',
    url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6',
    name: "Classic Timepiece",
    category: "Accessories",
    price: 399.99,
    description: "Elegant classic watch with genuine leather strap, sapphire crystal, and Swiss movement. A timeless piece for any collection.",
    features: [
      "Swiss movement",
      "Sapphire crystal",
      "Genuine leather strap",
      "30m water resistance",
      "Date display"
    ],
    specs: {
      "Movement": "Swiss Automatic",
      "Case": "316L Stainless Steel",
      "Crystal": "Sapphire",
      "Band": "Genuine Leather",
      "Water Resistance": "30m"
    }
  }
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = id ? mockProducts[id as keyof typeof mockProducts] : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="space-y-4">
              <img
                src={product.url}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
              <div className="grid grid-cols-4 gap-2">
                {/* Additional product images would go here */}
                <div className="aspect-square bg-gray-100 rounded-md"></div>
                <div className="aspect-square bg-gray-100 rounded-md"></div>
                <div className="aspect-square bg-gray-100 rounded-md"></div>
                <div className="aspect-square bg-gray-100 rounded-md"></div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-lg text-gray-500">{product.category}</p>
              </div>

              <div className="text-4xl font-bold text-gray-900">
                ${product.price}
              </div>

              <p className="text-gray-600">{product.description}</p>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Specifications</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-2">
                      <dt className="text-sm font-medium text-gray-500">{key}</dt>
                      <dd className="text-sm text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center hover:bg-blue-700 transition-colors">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;