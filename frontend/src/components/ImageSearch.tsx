import React, { useState } from 'react';
import { Upload, Search, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ImageResult {
  id: string;
  url: string;
  similarity: number;
  attributes: {
    name: string;
    category: string;
    price: number;
    description: string;
  };
}

function ImageSearch() {
  const navigate = useNavigate();
  const [knowledgeBase, setKnowledgeBase] = useState<string[]>([]);
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Simulated results for demonstration
  const mockResults: ImageResult[] = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      similarity: 0.95,
      attributes: {
        name: "Smart Watch Pro",
        category: "Electronics",
        price: 299.99,
        description: "Premium smartwatch with heart rate monitoring, GPS tracking, and a beautiful OLED display. Perfect for fitness enthusiasts and tech lovers alike."
      }
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12',
      similarity: 0.89,
      attributes: {
        name: "Digital Watch X",
        category: "Electronics",
        price: 199.99,
        description: "Modern digital watch with advanced features including water resistance up to 50m, stopwatch, and multiple time zones."
      }
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6',
      similarity: 0.82,
      attributes: {
        name: "Classic Timepiece",
        category: "Accessories",
        price: 399.99,
        description: "Elegant classic watch with genuine leather strap, sapphire crystal, and Swiss movement. A timeless piece for any collection."
      }
    }
  ];

  const handleKnowledgeBaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setKnowledgeBase(prev => [...prev, ...newImages]);
    }
  };

  const handleSearchImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSearchImage(URL.createObjectURL(file));
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setResults(mockResults);
        setLoading(false);
      }, 1500);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Image Search System</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Knowledge Base Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Knowledge Base Upload
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleKnowledgeBaseUpload}
                className="hidden"
                id="knowledge-base-upload"
              />
              <label
                htmlFor="knowledge-base-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-sm text-gray-600">
                  Click to upload images to knowledge base
                </span>
              </label>
            </div>
            {knowledgeBase.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {knowledgeBase.length} images in knowledge base
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {knowledgeBase.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Knowledge base ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Search Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Image Search
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleSearchImageUpload}
                className="hidden"
                id="search-image-upload"
              />
              <label
                htmlFor="search-image-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-sm text-gray-600">
                  Upload an image to search
                </span>
              </label>
            </div>
            {searchImage && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Search Image:</p>
                <img
                  src={searchImage}
                  alt="Search"
                  className="w-full h-40 object-contain rounded"
                />
              </div>
            )}
          </section>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-gray-600">Searching for similar images...</p>
          </div>
        ) : results.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Similar Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="relative group cursor-pointer transform transition-transform duration-200 hover:scale-105"
                  onClick={() => handleProductClick(result.id)}
                >
                  <img
                    src={result.url}
                    alt={result.attributes.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 text-white p-4">
                      <h3 className="font-semibold">{result.attributes.name}</h3>
                      <p>Category: {result.attributes.category}</p>
                      <p>Price: ${result.attributes.price}</p>
                      <p className="mt-2">
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </p>
                      <p className="mt-2 text-sm text-blue-300">Click to view details</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ImageSearch;