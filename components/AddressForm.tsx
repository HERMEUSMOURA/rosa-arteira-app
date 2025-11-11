// Crie um novo arquivo: components/AddressForm.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Address, saveUserAddress, getDefaultAddress } from '../hooks/storage';

interface AddressFormProps {
  onAddressSelect: (address: Address) => void;
  onCancel?: () => void;
  initialAddress?: Address;
}

export default function AddressForm({ onAddressSelect, onCancel, initialAddress }: AddressFormProps) {
  const [address, setAddress] = useState<Omit<Address, 'id'>>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (initialAddress) {
      const { id, ...addressData } = initialAddress;
      setAddress(addressData);
    } else {
      loadDefaultAddress();
    }
  }, [initialAddress]);

  const loadDefaultAddress = async () => {
    const defaultAddr = await getDefaultAddress();
    if (defaultAddr) {
      const { id, ...addressData } = defaultAddr;
      setAddress(addressData);
    }
  };

  const handleSubmit = async () => {
    // Validação básica
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.zipCode) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const success = await saveUserAddress(address);
      if (success) {
        // Criar objeto Address completo para passar para o pedido
        const completeAddress: Address = {
          ...address,
          id: Date.now().toString(), // ID temporário
        };
        onAddressSelect(completeAddress);
      } else {
        Alert.alert('Erro', 'Não foi possível salvar o endereço');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar endereço');
    }
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <Text className="text-lg font-bold mb-4">Endereço de Entrega</Text>
      
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="Rua *"
        value={address.street}
        onChangeText={(text) => setAddress({ ...address, street: text })}
      />
      
      <View className="flex-row mb-3">
        <TextInput
          className="border border-gray-300 rounded-lg p-3 flex-1 mr-2"
          placeholder="Número *"
          value={address.number}
          onChangeText={(text) => setAddress({ ...address, number: text })}
          keyboardType="numeric"
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-3 flex-1"
          placeholder="Complemento"
          value={address.complement}
          onChangeText={(text) => setAddress({ ...address, complement: text })}
        />
      </View>
      
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="Bairro *"
        value={address.neighborhood}
        onChangeText={(text) => setAddress({ ...address, neighborhood: text })}
      />
      
      <View className="flex-row mb-3">
        <TextInput
          className="border border-gray-300 rounded-lg p-3 flex-2 mr-2"
          placeholder="Cidade *"
          value={address.city}
          onChangeText={(text) => setAddress({ ...address, city: text })}
        />
        <TextInput
          className="border border-gray-300 rounded-lg p-3 flex-1"
          placeholder="UF *"
          value={address.state}
          onChangeText={(text) => setAddress({ ...address, state: text.toUpperCase() })}
          maxLength={2}
        />
      </View>
      
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="CEP *"
        value={address.zipCode}
        onChangeText={(text) => setAddress({ ...address, zipCode: text })}
        keyboardType="numeric"
      />
      
      <View className="flex-row items-center mb-6">
        <TouchableOpacity
          onPress={() => setAddress({ ...address, isDefault: !address.isDefault })}
          className="flex-row items-center"
        >
          <View className={`w-6 h-6 border border-gray-400 rounded mr-2 ${address.isDefault ? 'bg-blue-500' : 'bg-white'}`} />
          <Text>Definir como endereço padrão</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row space-x-3">
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 bg-gray-500 rounded-lg p-3"
          >
            <Text className="text-white text-center font-semibold">Cancelar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSubmit}
          className="flex-1 bg-blue-500 rounded-lg p-3"
        >
          <Text className="text-white text-center font-semibold">
            {initialAddress ? 'Atualizar' : 'Salvar Endereço'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}