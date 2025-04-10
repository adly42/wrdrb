import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import '../styles/main.css';

interface ClothingItem {
  id: string;
  image_url: string;
  name: string | null;
  brand: string | null;
  category: string;
  color: string;
  occasion: string;
}

interface ItemDetails {
  name: string;
  brand: string;
  category: string;
  color: string;
  occasion: string;
  customCategory?: string;
  customOccasion?: string;
}

const ClothingDatabase: React.FC = () => {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [itemDetails, setItemDetails] = useState<ItemDetails>({
    name: '',
    brand: '',
    category: '',
    color: '',
    occasion: '',
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomOccasion, setShowCustomOccasion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Add filter states
  const [filters, setFilters] = useState({
    category: '',
    color: '',
    occasion: ''
  });

  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const categories = [
    'Jacket',
    'Shirt',
    'T-Shirt',
    'Sweater',
    'Dress',
    'Skirt',
    'Pants',
    'Shorts',
    'Jeans',
    'Shoes',
    'Accessories',
    'Other...'
  ];

  const occasions = [
    'Casual',
    'Business Casual',
    'Formal',
    'Business Formal',
    'Sportswear',
    'Beachwear',
    'Party',
    'Other...'
  ];

  const colors = [
    'Black',
    'White',
    'Gray',
    'Navy',
    'Blue',
    'Red',
    'Green',
    'Yellow',
    'Purple',
    'Pink',
    'Brown',
    'Beige',
    'Orange',
    'Other...'
  ];

  const navigate = useNavigate();

  useEffect(() => {
    fetchClothingItems();
  }, []);

  const fetchClothingItems = async () => {
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) setClothingItems(data);
    } catch (error) {
      console.error('Error fetching clothing items:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0]);
      setShowQuestionnaire(true);
      
      // Create preview URL for the image
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setShowCustomCategory(value === 'Other...');
    setItemDetails(prev => ({
      ...prev,
      category: value === 'Other...' ? '' : value,
      customCategory: value === 'Other...' ? '' : undefined
    }));
  };

  const handleOccasionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setShowCustomOccasion(value === 'Other...');
    setItemDetails(prev => ({
      ...prev,
      occasion: value === 'Other...' ? '' : value,
      customOccasion: value === 'Other...' ? '' : undefined
    }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setItemDetails(prev => ({
      ...prev,
      color: value === 'Other...' ? '' : value
    }));
  };

  const handleCustomInputChange = (field: 'category' | 'occasion', value: string) => {
    setItemDetails(prev => ({
      ...prev,
      [field]: value,
      [`custom${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
    }));
  };

  const handleRotateLeft = () => {
    setImageRotation((prevRotation) => (prevRotation - 90) % 360);
  };

  const handleRotateRight = () => {
    setImageRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const handleUpload = async () => {
    if (!selectedFile || !itemDetails.category || !itemDetails.color || !itemDetails.occasion) {
      alert('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB. Please compress your image if it\'s larger.');
      }

      // Check file type
      if (!selectedFile.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // If image is rotated, we need to create a canvas to rotate the image
      let fileToUpload = selectedFile;
      if (imageRotation !== 0) {
        fileToUpload = await rotateImage(selectedFile, imageRotation);
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Starting upload to Supabase storage...');
      const { error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(filePath, fileToUpload);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('clothing-images')
        .getPublicUrl(filePath);

      console.log('Inserting record into database...');
      const { data: insertData, error: insertError } = await supabase
        .from('clothing_items')
        .insert([
          {
            user_id: user.id,
            image_url: publicUrl,
            name: itemDetails.name || null,
            brand: itemDetails.brand || null,
            category: itemDetails.category,
            color: itemDetails.color,
            occasion: itemDetails.occasion
          },
        ])
        .select();

      if (insertError) {
        console.error('Database insert error details:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw new Error(`Database insert failed: ${insertError.message || 'Unknown error'}`);
      }

      console.log('Insert successful:', insertData);
      setSelectedFile(null);
      setShowQuestionnaire(false);
      setItemDetails({
        name: '',
        brand: '',
        category: '',
        color: '',
        occasion: '',
      });
      fetchClothingItems();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  // Function to rotate image using canvas
  const rotateImage = (file: File, rotation: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas dimensions based on rotation
        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        // Translate and rotate
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create blob from canvas'));
            return;
          }
          
          // Create a new file from the blob
          const rotatedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          resolve(rotatedFile);
        }, file.type);
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Add filter change handlers
  const handleFilterChange = (field: 'category' | 'color' | 'occasion', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add filtered items computation
  const filteredItems = clothingItems.filter(item => {
    return (
      (!filters.category || item.category === filters.category) &&
      (!filters.color || item.color === filters.color) &&
      (!filters.occasion || item.occasion === filters.occasion)
    );
  });

  const handleEdit = (item: ClothingItem) => {
    setEditingItem(item);
    setItemDetails({
      name: item.name || '',
      brand: item.brand || '',
      category: item.category,
      color: item.color,
      occasion: item.occasion
    });
    setShowEditModal(true);
  };

  const handleDelete = async (item: ClothingItem) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        // Delete from storage
        const filePath = item.image_url.split('/').pop();
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('clothing-images')
            .remove([filePath]);

          if (storageError) throw storageError;
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('clothing_items')
          .delete()
          .eq('id', item.id);

        if (dbError) throw dbError;

        // Update UI
        setClothingItems(items => items.filter(i => i.id !== item.id));
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item');
      }
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('clothing_items')
        .update({
          name: itemDetails.name || null,
          brand: itemDetails.brand || null,
          category: itemDetails.category,
          color: itemDetails.color,
          occasion: itemDetails.occasion
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      // Update UI
      setClothingItems(items =>
        items.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                name: itemDetails.name || null,
                brand: itemDetails.brand || null,
                category: itemDetails.category,
                color: itemDetails.color,
                occasion: itemDetails.occasion
              }
            : item
        )
      );

      setShowEditModal(false);
      setEditingItem(null);
      setItemDetails({
        name: '',
        brand: '',
        category: '',
        color: '',
        occasion: '',
      });
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Clothing Database</h1>
        </div>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{
          fontSize: "16px",
          color: "#fefefd",
          backgroundColor: "#d07d6b",
          padding: "10px 20px",
          textTransform: "uppercase",
          fontWeight: "bold",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
          display: "inline-block",
          textDecoration: "none",
          transition: "all 0.3s ease-in-out"
        }}>
          Back to Dashboard
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="section-title">Add New Item</h2>
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
          style={{
            padding: '2rem',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: isDragActive ? '#f0f9ff' : '#f9fafb',
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the image here...</p>
          ) : (
            <div>
              <p>Drag and drop an image here, or click to select a file</p>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPEG, PNG, GIF, WebP (max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="section-title">Filters</h2>
        <div className="filters-grid">
          <div className="form-group">
            <label>Category:</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Color:</label>
            <select
              value={filters.color}
              onChange={(e) => handleFilterChange('color', e.target.value)}
              className="form-select"
            >
              <option value="">All Colors</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Occasion:</label>
            <select
              value={filters.occasion}
              onChange={(e) => handleFilterChange('occasion', e.target.value)}
              className="form-select"
            >
              <option value="">All Occasions</option>
              {occasions.map(occasion => (
                <option key={occasion} value={occasion}>{occasion}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questionnaire Modal */}
      {showQuestionnaire && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title">Item Details</h2>
            
            {/* Image Preview with Rotation Controls */}
            <div className="image-preview-container">
              <div className="image-preview-wrapper">
                <img 
                  src={imagePreview || ''} 
                  alt="Preview" 
                  className="image-preview"
                  style={{ transform: `rotate(${imageRotation}deg)` }}
                />
              </div>
              <div className="image-rotation-controls">
                <button 
                  onClick={handleRotateLeft} 
                  className="btn btn-secondary"
                  style={{
                    fontSize: "16px",
                    color: "#fefefd",
                    backgroundColor: "#d07d6b",
                    padding: "10px 20px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-block",
                    textDecoration: "none",
                    transition: "all 0.3s ease-in-out"
                  }}
                  title="Rotate Left"
                >
                  ↺
                </button>
                <button 
                  onClick={handleRotateRight} 
                  className="btn btn-secondary"
                  style={{
                    fontSize: "16px",
                    color: "#fefefd",
                    backgroundColor: "#d07d6b",
                    padding: "10px 20px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-block",
                    textDecoration: "none",
                    transition: "all 0.3s ease-in-out"
                  }}
                  title="Rotate Right"
                >
                  ↻
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Name (optional):</label>
              <input
                type="text"
                placeholder="Give your item a name"
                value={itemDetails.name}
                onChange={(e) => setItemDetails(prev => ({ ...prev, name: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Brand (optional):</label>
              <input
                type="text"
                placeholder="Enter the brand name"
                value={itemDetails.brand}
                onChange={(e) => setItemDetails(prev => ({ ...prev, brand: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Category:</label>
              <select 
                value={itemDetails.category} 
                onChange={handleCategoryChange}
                className="form-select"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {showCustomCategory && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={itemDetails.customCategory || ''}
                  onChange={(e) => handleCustomInputChange('category', e.target.value)}
                  className="form-input"
                />
              )}
            </div>

            <div className="form-group">
              <label>Color:</label>
              <select 
                value={itemDetails.color} 
                onChange={handleColorChange}
                className="form-select"
              >
                <option value="">Select a color</option>
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Occasion:</label>
              <select 
                value={itemDetails.occasion} 
                onChange={handleOccasionChange}
                className="form-select"
              >
                <option value="">Select an occasion</option>
                {occasions.map(occasion => (
                  <option key={occasion} value={occasion}>{occasion}</option>
                ))}
              </select>
              {showCustomOccasion && (
                <input
                  type="text"
                  placeholder="Enter custom occasion"
                  value={itemDetails.customOccasion || ''}
                  onChange={(e) => handleCustomInputChange('occasion', e.target.value)}
                  className="form-input"
                />
              )}
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowQuestionnaire(false);
                  setSelectedFile(null);
                  setItemDetails({
                    name: '',
                    brand: '',
                    category: '',
                    color: '',
                    occasion: '',
                  });
                }}
                className="btn btn-secondary"
                style={{
                  fontSize: "16px",
                  color: "#fefefd",
                  backgroundColor: "#d07d6b",
                  padding: "10px 20px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  textDecoration: "none",
                  transition: "all 0.3s ease-in-out"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!itemDetails.category || !itemDetails.color || !itemDetails.occasion || isUploading}
                className="btn btn-primary"
                style={{
                  fontSize: "16px",
                  color: "#fefefd",
                  backgroundColor: "#d07d6b",
                  padding: "10px 20px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  textDecoration: "none",
                  transition: "all 0.3s ease-in-out",
                  opacity: (!itemDetails.category || !itemDetails.color || !itemDetails.occasion || isUploading) ? 0.5 : 1
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clothing Items Grid */}
      <div className="clothing-grid">
        {filteredItems.map((item) => (
          <div key={item.id} className="clothing-item">
            <div className="clothing-image-container">
              <img
                src={item.image_url}
                alt={item.name || item.category}
                className="clothing-image"
              />
            </div>
            <div className="clothing-details">
              <h3>{item.name || item.category}</h3>
              {item.name && <p className="item-category">{item.category}</p>}
              {item.brand && <p className="item-brand">{item.brand}</p>}
              <p>Color: {item.color}</p>
              <p>Occasion: {item.occasion}</p>
              <div className="clothing-actions">
                <button
                  onClick={() => handleEdit(item)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: "16px",
                    color: "#fefefd",
                    backgroundColor: "#d07d6b",
                    padding: "10px 20px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-block",
                    textDecoration: "none",
                    transition: "all 0.3s ease-in-out"
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="btn btn-danger"
                  style={{
                    fontSize: "16px",
                    color: "#fefefd",
                    backgroundColor: "#ef4444",
                    padding: "10px 20px",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    borderRadius: "5px",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-block",
                    textDecoration: "none",
                    transition: "all 0.3s ease-in-out"
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="section-title">Edit Item</h2>
            <div className="form-group">
              <label>Name (optional):</label>
              <input
                type="text"
                placeholder="Give your item a name"
                value={itemDetails.name}
                onChange={(e) => setItemDetails(prev => ({ ...prev, name: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Brand (optional):</label>
              <input
                type="text"
                placeholder="Enter the brand name"
                value={itemDetails.brand}
                onChange={(e) => setItemDetails(prev => ({ ...prev, brand: e.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Category:</label>
              <select
                value={itemDetails.category}
                onChange={handleCategoryChange}
                className="form-select"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {showCustomCategory && (
                <input
                  type="text"
                  placeholder="Enter custom category"
                  value={itemDetails.customCategory || ''}
                  onChange={(e) => handleCustomInputChange('category', e.target.value)}
                  className="form-input"
                />
              )}
            </div>

            <div className="form-group">
              <label>Color:</label>
              <select
                value={itemDetails.color}
                onChange={handleColorChange}
                className="form-select"
              >
                <option value="">Select a color</option>
                {colors.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Occasion:</label>
              <select
                value={itemDetails.occasion}
                onChange={handleOccasionChange}
                className="form-select"
              >
                <option value="">Select an occasion</option>
                {occasions.map(occasion => (
                  <option key={occasion} value={occasion}>{occasion}</option>
                ))}
              </select>
              {showCustomOccasion && (
                <input
                  type="text"
                  placeholder="Enter custom occasion"
                  value={itemDetails.customOccasion || ''}
                  onChange={(e) => handleCustomInputChange('occasion', e.target.value)}
                  className="form-input"
                />
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  setItemDetails({
                    name: '',
                    brand: '',
                    category: '',
                    color: '',
                    occasion: ''
                  });
                }}
                className="btn btn-secondary"
                style={{
                  fontSize: "16px",
                  color: "#fefefd",
                  backgroundColor: "#d07d6b",
                  padding: "10px 20px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  textDecoration: "none",
                  transition: "all 0.3s ease-in-out"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!itemDetails.category || !itemDetails.color || !itemDetails.occasion}
                className="btn btn-primary"
                style={{
                  fontSize: "16px",
                  color: "#fefefd",
                  backgroundColor: "#d07d6b",
                  padding: "10px 20px",
                  textTransform: "uppercase",
                  fontWeight: "bold",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  textDecoration: "none",
                  transition: "all 0.3s ease-in-out",
                  opacity: (!itemDetails.category || !itemDetails.color || !itemDetails.occasion) ? 0.5 : 1
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClothingDatabase; 