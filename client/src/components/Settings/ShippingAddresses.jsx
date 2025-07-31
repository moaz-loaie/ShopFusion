import React, { useState, useEffect } from 'react';
import { SettingsCard, SettingsButton } from './SettingsComponents';
import api from '../../services/api';

const ShippingAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/user/shipping-addresses');
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/user/shipping-addresses', newAddress);
      setShowForm(false);
      setNewAddress({
        name: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: false,
      });
      fetchAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleDelete = async (addressId) => {
    try {
      await api.delete(`/user/shipping-addresses/${addressId}`);
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await api.patch(`/user/shipping-addresses/${addressId}/default`);
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  return (
    <SettingsCard title="Shipping Addresses">
      <div className="space-y-4">
        {addresses.map((address) => (
          <div key={address.id} className="p-4 border rounded space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{address.name}</h3>
              <div className="flex gap-2">
                {!address.isDefault && (
                  <SettingsButton onClick={() => handleSetDefault(address.id)} variant="secondary">
                    Set as Default
                  </SettingsButton>
                )}
                <SettingsButton onClick={() => handleDelete(address.id)} variant="danger">
                  Delete
                </SettingsButton>
              </div>
            </div>
            <p className="text-sm">
              {address.street}
              <br />
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
            </p>
            {address.isDefault && <span className="text-sm text-green-600">Default Address</span>}
          </div>
        ))}

        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={newAddress.name}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Street"
              value={newAddress.street}
              onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="p-2 border rounded"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Postal Code"
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Country"
                value={newAddress.country}
                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                className="p-2 border rounded"
                required
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
              />
              Set as default address
            </label>
            <div className="flex gap-2">
              <SettingsButton type="submit">Save Address</SettingsButton>
              <SettingsButton type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </SettingsButton>
            </div>
          </form>
        ) : (
          <SettingsButton onClick={() => setShowForm(true)}>Add New Address</SettingsButton>
        )}
      </div>
    </SettingsCard>
  );
};

export default ShippingAddresses;
